"use client";
import React, { useState, useCallback, useContext, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Check, Copy, MapPin } from "lucide-react";
import { useCart } from "@/context/CartContext";
import AuthContext from "@/context/AuthContext";
import { toast } from "react-toastify";
import Image from "next/image";
import liff from "@line/liff";
import axios from "axios";

const LineCheckoutModal = ({ isOpen, onClose }) => {
  const { cartItems, getCartSummary, clearCart } = useCart();
  const { user, lineProfile } = useContext(AuthContext);
  const { subtotal, totalItems } = getCartSummary();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [isLiffInitialized, setIsLiffInitialized] = useState(false);
  const [orderProcessed, setOrderProcessed] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);

  const LINE_OA_ID = process.env.NEXT_PUBLIC_LINE_OA_ID || "@yourLineOaId";
  const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID;
  const LINE_OA_URL = `https://line.me/R/ti/p/${LINE_OA_ID.startsWith('@') ? LINE_OA_ID : `@${LINE_OA_ID}`}`;

  // Initialize LIFF when modal opens
  useEffect(() => {
    const initializeLiff = async () => {
      try {
        if (!LIFF_ID) throw new Error("LIFF ID is not set in environment variables");
        await liff.init({ liffId: LIFF_ID });
        setIsLiffInitialized(true);
        console.log("LIFF initialized successfully");
      } catch (error) {
        console.error("LIFF initialization error:", error);
        toast.error("Failed to initialize LINE integration");
      }
    };

    if (isOpen && !isLiffInitialized) initializeLiff();
  }, [isOpen, LIFF_ID, isLiffInitialized]);

  // Fetch user addresses when modal opens
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!isOpen || !user) return;

      setIsLoadingAddresses(true);
      try {
        const response = await axios.get("/api/user/address");
        const addressData = response.data.addresses || [];
        setAddresses(addressData);

        // Set default address as selected if available
        const defaultAddress = addressData.find((addr) => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress._id);
        } else if (addressData.length > 0) {
          setSelectedAddressId(addressData[0]._id);
        }
      } catch (error) {
        console.error("Failed to fetch addresses:", error);
        toast.error("Could not load your saved addresses");
      } finally {
        setIsLoadingAddresses(false);
      }
    };

    fetchAddresses();
  }, [isOpen, user]);

  // Get the selected address
  const getSelectedAddress = useCallback(() => {
    if (!selectedAddressId || addresses.length === 0) return null;
    return addresses.find((addr) => addr._id === selectedAddressId);
  }, [selectedAddressId, addresses]);

  // Format the order message with address
  const formatOrderMessage = useCallback(() => {
    const userName = user?.name || lineProfile?.displayName || "Customer";
    let message = `🛒 New Order from ${userName} 🛒\n`;
    if (orderId) message += `Order ID: ${orderId}\n\n`;

    // Add selected address if available
    const selectedAddress = getSelectedAddress();
    if (selectedAddress) {
      message += `📍 Shipping Address:\n`;
      message += `${selectedAddress.recipientName}\n`;
      message += `${selectedAddress.street}\n`;
      message += `${selectedAddress.city}, ${selectedAddress.state} ${selectedAddress.postalCode}\n`;
      message += `${selectedAddress.country}\n`;
      if (selectedAddress.phone) message += `Phone: ${selectedAddress.phone}\n`;
      message += `\n`;
    }

    // Add order items
    cartItems.forEach((item, index) => {
      message += `${index + 1}. ${item.name}\n`;
      message += `   ${item.quantity} x ฿${item.price.toFixed(2)} = ฿${(item.quantity * item.price).toFixed(2)}\n`;
    });
    message += "\n------------------------\n";
    message += `Subtotal: ฿${subtotal.toFixed(2)}\n`;
    message += `Total Items: ${totalItems}\n`;

    if (!selectedAddress) {
      message += "\nPlease reply with your shipping details to complete the order.";
    } else {
      message += "\nPlease confirm the order and address by replying to this message.";
    }

    return message;
  }, [cartItems, subtotal, totalItems, user, lineProfile, orderId, getSelectedAddress]);

  // Copy order message to clipboard
  const copyOrderToClipboard = useCallback(() => {
    const orderMessage = formatOrderMessage();
    navigator.clipboard
      .writeText(orderMessage)
      .then(() => toast.success("Order details copied to clipboard! Paste it in LINE chat"))
      .catch((err) => {
        console.error("Failed to copy text:", err);
        toast.error("Could not copy to clipboard");
      });
  }, [formatOrderMessage]);

  // Handle LINE checkout process
  const handleLineCheckout = useCallback(async () => {
    setIsProcessing(true);

    try {
      if (!LIFF_ID) throw new Error("LIFF ID is not set in environment variables");
      if (!isLiffInitialized) {
        await liff.init({ liffId: LIFF_ID });
        setIsLiffInitialized(true);
      }

      if (!liff.isLoggedIn()) {
        console.log("User not logged in, initiating LINE login");
        liff.login({ redirectUri: window.location.href });
        setIsProcessing(false);
        return;
      }

      const orderMessage = formatOrderMessage();
      const userName = user?.name || lineProfile?.displayName || "Customer";
      const selectedAddress = getSelectedAddress();

      // Prepare order data for API
      const orderData = {
        cartItems,
        totalAmount: subtotal,
        message: orderMessage,
        userName,
        shippingAddress: selectedAddress
          ? {
              recipientName: selectedAddress.recipientName,
              street: selectedAddress.street,
              city: selectedAddress.city,
              state: selectedAddress.state,
              postalCode: selectedAddress.postalCode,
              country: selectedAddress.country,
              phone: selectedAddress.phone || "",
              _id: selectedAddress._id,
            }
          : null,
      };

      console.log("Sending order to /api/orders with data:", orderData);

      // Send order to backend
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        const text = await response.text();
        console.error("Raw API response:", text);
        throw new Error(`Server returned invalid JSON: ${text.slice(0, 100)}...`);
      }

      if (!response.ok) {
        console.error("API error response:", data);
        throw new Error(data.error || data.details || "Unknown error from server");
      }

      console.log("Order API response:", data);
      setOrderId(data.orderId);
      clearCart();
      setOrderProcessed(true);

      if (data.warning) {
        toast.warn(data.warning);
        console.warn("Warning from API:", data.warning);
      }

      // Copy order message to clipboard
      await navigator.clipboard.writeText(orderMessage);
      toast.success("Order details copied to clipboard! Opening LINE...");

      // Attempt to send message directly via LIFF
      try {
        if (liff.isInClient()) {
          await liff.shareTargetPicker([
            {
              type: "text",
              text: orderMessage,
            },
          ]);
          toast.success("Order message sent to LINE!");
        } else {
          // Fallback to opening LINE OA chat
          window.open(LINE_OA_URL, "_blank");
          toast.info("Please paste the copied order message in the LINE chat.");
        }
      } catch (lineError) {
        console.error("Failed to send/share LINE message:", lineError);
        toast.info("Please manually open LINE and paste the order message.");
        // Open LINE OA as a fallback
        window.open(LINE_OA_URL, "_blank");
      }

      setShowThankYou(true);
      setTimeout(() => {
        setShowThankYou(false);
        onClose();
      }, 5000);
    } catch (error) {
      console.error("LINE checkout error:", error);
      toast.error(`Failed to process order: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [
    formatOrderMessage,
    cartItems,
    subtotal,
    clearCart,
    onClose,
    LINE_OA_URL,
    LIFF_ID,
    isLiffInitialized,
    user,
    lineProfile,
    getSelectedAddress,
  ]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 flex items-center justify-center p-4 z-50"
          >
            <div className="w-full max-w-md bg-surface-card rounded-xl shadow-2xl overflow-hidden">
              <div className="flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-border-primary flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-text-primary">Confirm Order</h2>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-interactive-muted rounded-full transition-colors duration-200"
                    disabled={isProcessing}
                  >
                    <X className="h-5 w-5 text-text-secondary" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {/* Address Selection Section */}
                  {addresses.length > 0 && (
                    <div className="mb-4">
                      <h3 className="font-medium text-text-primary mb-2 flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        Shipping Address
                      </h3>
                      <div className="bg-background-secondary p-3 rounded-lg">
                        {isLoadingAddresses ? (
                          <div className="flex justify-center py-2">
                            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <select
                              value={selectedAddressId || ""}
                              onChange={(e) => setSelectedAddressId(e.target.value)}
                              className="w-full p-2 bg-background border border-border-primary rounded-md text-sm"
                            >
                              <option value="">-- Select an address (optional) --</option>
                              {addresses.map((address) => (
                                <option key={address._id} value={address._id}>
                                  {address.recipientName} - {address.street}, {address.city}
                                  {address.isDefault ? " (Default)" : ""}
                                </option>
                              ))}
                            </select>

                            {selectedAddressId && (
                              <div className="text-xs text-text-secondary bg-background p-2 rounded border border-border-primary">
                                {(() => {
                                  const address = addresses.find((a) => a._id === selectedAddressId);
                                  if (!address) return null;
                                  return (
                                    <>
                                      <p className="font-medium">{address.recipientName}</p>
                                      <p>{address.street}</p>
                                      <p>
                                        {address.city}, {address.state} {address.postalCode}
                                      </p>
                                      <p>{address.country}</p>
                                      {address.phone && <p>Phone: {address.phone}</p>}
                                    </>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <p className="text-sm text-text-secondary mb-2">
                      Your order will be sent to our LINE Official Account ({LINE_OA_ID}).{" "}
                      {orderProcessed
                        ? "The message has been copied to your clipboard. Please paste it in the LINE chat."
                        : ""}
                    </p>
                    <div className="bg-background-secondary p-4 rounded-lg text-sm font-mono whitespace-pre-wrap relative">
                      {formatOrderMessage()}
                      {orderProcessed && (
                        <button
                          onClick={copyOrderToClipboard}
                          className="absolute top-2 right-2 p-1 rounded bg-interactive-muted hover:bg-interactive-hover transition-colors"
                          title="Copy to clipboard"
                        >
                          <Copy className="h-4 w-4 text-text-secondary" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4 mt-6">
                    <h3 className="font-medium text-text-primary">Order Summary</h3>
                    {cartItems.map((item) => (
                      <div key={item.productId} className="flex items-center space-x-3">
                        <div className="relative h-12 w-12 flex-shrink-0">
                          <Image src={item.image} alt={item.name} fill className="object-cover rounded-md" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-text-primary">{item.name}</p>
                          <p className="text-xs text-text-muted">
                            {item.quantity} x ฿{item.price.toFixed(2)}
                          </p>
                        </div>
                        <p className="text-sm font-medium text-text-primary">
                          ฿{(item.quantity * item.price).toFixed(2)}
                        </p>
                      </div>
                    ))}
                    <div className="border-t border-border-primary pt-3 mt-3">
                      <div className="flex justify-between">
                        <span className="font-medium text-text-primary">Total</span>
                        <span className="font-semibold text-text-primary">฿{subtotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 border-t border-border-primary">
                  {!orderProcessed ? (
                    <button
                      onClick={handleLineCheckout}
                      disabled={isProcessing || cartItems.length === 0}
                      className="w-full flex items-center justify-center space-x-2 p-3 bg-[#06C755] text-white rounded-lg hover:bg-[#05b54d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <>
                          <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <span>Process Order via LINE</span>
                          <ExternalLink className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="flex flex-col space-y-3">
                      <button
                        onClick={copyOrderToClipboard}
                        className="w-full flex items-center justify-center space-x-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <span>Copy Order Message</span>
                        <Copy className="h-4 w-4" />
                      </button>
                      <a
                        href={LINE_OA_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center space-x-2 p-3 bg-[#06C755] text-white rounded-lg hover:bg-[#05b54d] transition-colors"
                      >
                        <span>Open LINE Chat</span>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
          {showThankYou && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5 }}
              className="fixed inset-0 flex items-center justify-center z-60"
            >
              <div className="bg-surface-card p-6 rounded-xl shadow-2xl max-w-sm w-full text-center">
                <div className="flex justify-center mb-4">
                  <div className="bg-success/20 p-3 rounded-full">
                    <Check className="h-6 w-6 text-success" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">Thank You!</h3>
                <p className="text-sm text-text-secondary mb-4">
                  Your order (ID: {orderId}) has been processed. Please paste the copied message to our LINE Official
                  Account ({LINE_OA_ID}).
                </p>
                <button
                  onClick={() => {
                    setShowThankYou(false);
                    onClose();
                  }}
                  className="inline-flex items-center px-4 py-2 bg-primary text-text-inverted rounded-lg hover:bg-primary-dark transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
};

export default LineCheckoutModal;