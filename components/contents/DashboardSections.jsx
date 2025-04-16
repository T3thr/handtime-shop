"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useUserData, useOrders, useWishlist } from "@/hooks/dashboardHooks";
import { useUserReviews } from "@/hooks/reviewHooks";
import { useCart } from "@/context/CartContext";
import ProductModal from "./ProductModal";
import {
  DashboardCard,
  SectionHeader,
  DataTable,
  Card,
  LoadingSpinner,
  EmptyState,
  OrderStatus,
  Badge,
  Pagination,
} from "@/components/contents/DashboardUI";
import { FaShoppingBag, FaHeart, FaBox, FaTrash, FaShoppingCart, FaInfoCircle, FaSortUp, FaSortDown, FaStar, FaBell } from "react-icons/fa";
import { Heart, ShoppingBag, Filter, Search, X, ChevronRight, ArrowUpRight, Star, Sparkles } from "lucide-react";
import { MdLocalShipping } from "react-icons/md";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { toast } from "react-toastify";
import ReviewModal from "./ReviewModal";

// Order Info Modal Component
const OrderInfoModal = ({ isOpen, onClose, order }) => {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        className="bg-background rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg sm:text-xl font-bold">Order Details</h3>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-text-secondary text-sm mb-1">Order ID</p>
            <p className="font-medium">{order._id}</p>
          </div>
          <div>
            <p className="text-text-secondary text-sm mb-1">Date</p>
            <p className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-text-secondary text-sm mb-1">Status</p>
            <OrderStatus status={order.status} />
          </div>
          <div>
            <p className="text-text-secondary text-sm mb-1">Total</p>
            <p className="font-medium text-primary">฿{order.totalAmount.toFixed(2)}</p>
          </div>
        </div>

        <div className="mb-6">
          <h4 className="font-medium mb-3">Shipping Information</h4>
          <div className="bg-background-secondary p-3 rounded-lg">
            <p className="mb-1"><span className="font-medium">Method:</span> {order.shippingMethod || "Standard"}</p>
            {order.shippingAddress && (
              <>
                <p className="mb-1"><span className="font-medium">Address:</span> {order.shippingAddress.street}</p>
                <p className="mb-1">{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                <p>{order.shippingAddress.country}</p>
              </>
            )}
          </div>
        </div>

        <div className="mb-6">
          <h4 className="font-medium mb-3">Payment Information</h4>
          <div className="bg-background-secondary p-3 rounded-lg">
            <p className="mb-1"><span className="font-medium">Method:</span> {order.paymentMethod || "Credit Card"}</p>
            <p className="mb-1"><span className="font-medium">Subtotal:</span> ฿{(order.totalAmount - (order.shippingCost || 0)).toFixed(2)}</p>
            <p className="mb-1"><span className="font-medium">Shipping:</span> ฿{(order.shippingCost || 0).toFixed(2)}</p>
            <p className="font-medium text-primary"><span className="font-medium">Total:</span> ฿{order.totalAmount.toFixed(2)}</p>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-3">Order Items</h4>
          <div className="border border-border-primary rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-border-primary">
              <thead className="bg-background-secondary">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Quantity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="bg-background divide-y divide-border-primary">
                {order.items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 relative rounded-md overflow-hidden">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-background-secondary flex items-center justify-center">
                              <FaBox className="text-text-muted" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-text-primary">{item.name}</div>
                          {item.variant && <div className="text-xs text-text-secondary">{item.variant}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-text-primary">฿{item.price.toFixed(2)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-text-primary">{item.quantity}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-text-primary">
                      ฿{(item.price * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {order.status === "delivered" && (
          <div className="mt-6">
            <h4 className="font-medium mb-3">Reviews</h4>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div key={item.productId} className="flex justify-between items-center p-3 bg-background-secondary rounded-lg">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0 relative rounded-md overflow-hidden mr-3">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-background-tertiary flex items-center justify-center">
                          <FaBox className="text-text-muted" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-text-primary">{item.name}</div>
                      {item.reviewStatus ? (
                        <div className="text-xs text-success flex items-center">
                          <FaStar className="mr-1" /> Reviewed
                        </div>
                      ) : null}
                    </div>
                  </div>
                  {!item.reviewStatus && (
                    <button 
                      onClick={() => {
                        onClose();
                        setTimeout(() => {
                          document.dispatchEvent(new CustomEvent('openReviewModal', { 
                            detail: { 
                              product: { 
                                _id: item.productId, 
                                name: item.name,
                                images: item.image ? [{ url: item.image }] : [],
                              }, 
                              orderId: order._id 
                            } 
                          }));
                        }, 300);
                      }}
                      className="px-3 py-1 bg-primary text-text-inverted text-sm rounded-md hover:bg-primary-dark transition-colors duration-200 flex items-center"
                    >
                      <FaStar className="mr-1" /> Review
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-background-secondary text-text-primary rounded-md hover:bg-background-hover transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export const OverviewSection = ({ session, setActiveSection }) => {
  const { userData, isLoading: userLoading, isError: userError } = useUserData();
  const { orders, isLoading: ordersLoading, isError: ordersError } = useOrders(1, 2);
  const { wishlist, isLoading: wishlistLoading, isError: wishlistError } = useWishlist();
  const router = useRouter();
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const isLoading = userLoading || ordersLoading || wishlistLoading;
  const isError = userError || ordersError || wishlistError;

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    } else if (sortConfig.key === key && sortConfig.direction === 'descending') {
      direction = null;
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'ascending' ? <FaSortUp className="inline ml-1" /> : <FaSortDown className="inline ml-1" />;
  };

  const sortedOrders = useMemo(() => {
    let sortableOrders = [...(orders || [])];
    if (sortConfig.key && sortConfig.direction) {
      sortableOrders.sort((a, b) => {
        if (sortConfig.key === 'createdAt') {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          
          if (sortConfig.direction === 'ascending') {
            return dateA - dateB;
          }
          return dateB - dateA;
        } else if (sortConfig.key === 'totalAmount') {
          if (sortConfig.direction === 'ascending') {
            return a.totalAmount - b.totalAmount;
          }
          return b.totalAmount - a.totalAmount;
        } else {
          if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (a[sortConfig.key] > b[sortConfig.key]) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
          return 0;
        }
      });
    }
    return sortableOrders;
  }, [orders, sortConfig]);

  const handleOpenInfoModal = (order) => {
    setSelectedOrder(order);
    setIsInfoModalOpen(true);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return (
      <div className="text-center py-8">
        <p className="text-error mb-4">Failed to load dashboard data</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-text-inverted rounded-lg hover:bg-primary-dark transition-colors duration-300"
        >
          Retry
        </button>
      </div>
    );
  }

  const stats = [
    {
      icon: FaShoppingBag,
      title: "Total Orders",
      value: userData?.stats?.totalOrders || 0,
      color: "text-primary",
    },
    { icon: FaHeart, title: "Wishlist Items", value: wishlist?.length || 0, color: "text-error" },
    {
      icon: MdLocalShipping,
      title: "In Transit",
      value: orders?.filter((o) => o.status === "shipped").length || 0,
      color: "text-purple-400",
    },
    {
      icon: FaBox,
      title: "Delivered",
      value: orders?.filter((o) => o.status === "delivered").length || 0,
      color: "text-success",
    },
  ];

  const orderColumns = [
    { 
      header: "Order ID", 
      accessor: "orderId", 
      className: "font-medium text-primary",
      sortable: true,
      onClick: () => requestSort("orderId"),
      headerContent: () => (
        <>Order ID {getSortIcon("orderId")}</>
      )
    },
    {
      header: "Date",
      accessor: "createdAt",
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
      sortable: true,
      onClick: () => requestSort("createdAt"),
      headerContent: () => (
        <>Date {getSortIcon("createdAt")}</>
      )
    },
    { 
      header: "Status", 
      accessor: "status", 
      render: (row) => <OrderStatus status={row.status} />,
      sortable: true,
      onClick: () => requestSort("status"),
      headerContent: () => (
        <>Status {getSortIcon("status")}</>
      )
    },
    {
      header: "Info",
      accessor: "items",
      render: (row) => (
        <div className="flex flex-col">
          <div className="flex items-center mb-1">
            {row.items.slice(0, 3).map((item, index) => (
              <div
                key={index}
                className="w-8 h-8 rounded-full overflow-hidden border-2 border-background -ml-2 first:ml-0"
              >
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={32}
                    height={32}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-background-secondary flex items-center justify-center">
                    <FaBox className="text-text-muted text-xs" />
                  </div>
                )}
              </div>
            ))}
            {row.items.length > 3 && (
              <div className="w-8 h-8 rounded-full bg-background-secondary border-2 border-background -ml-2 flex items-center justify-center">
                <span className="text-xs text-text-muted">+{row.items.length - 3}</span>
              </div>
            )}
          </div>
          <div className="text-xs text-text-secondary">
            {row.items.map(item => item.name).slice(0, 2).join(", ")}
            {row.items.length > 2 ? ` and ${row.items.length - 2} more` : ""}
          </div>
          <button
            onClick={() => handleOpenInfoModal(row)}
            className="text-xs text-primary hover:text-primary-dark mt-1 flex items-center"
          >
            <FaInfoCircle className="mr-1" /> Details
          </button>
        </div>
      ),
    },
    {
      header: "Total",
      accessor: "totalAmount",
      render: (row) => `฿${row.totalAmount.toFixed(2)}`,
      sortable: true,
      onClick: () => requestSort("totalAmount"),
      headerContent: () => (
        <>Total {getSortIcon("totalAmount")}</>
      )
    },
  ];

  return (
    <>
      <div className="space-y-6">
        <SectionHeader
          title="Dashboard Overview"
          description="Welcome back! Here's a summary of your recent activity."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <DashboardCard
              key={index}
              icon={stat.icon}
              title={stat.title}
              value={stat.value}
              color={stat.color}
            />
          ))}
        </div>

        <Card>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
            <h3 className="text-lg font-bold mb-2 sm:mb-0">Recent Orders</h3>
            <button
              onClick={() => setActiveSection("orders")}
              className="text-sm text-primary hover:text-primary-dark flex items-center"
            >
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          {orders && orders.length > 0 ? (
            <DataTable
              columns={orderColumns}
              data={sortedOrders.slice(0, 5)}
              keyField="_id"
              emptyMessage="No orders found"
            />
          ) : (
            <EmptyState
              icon={FaShoppingBag}
              title="No Orders Yet"
              description="Your order history will appear here once you make a purchase."
              action={{
                label: "Start Shopping",
                onClick: () => router.push("/"),
              }}
            />
          )}
        </Card>

        <Card>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
            <h3 className="text-lg font-bold mb-2 sm:mb-0">Wishlist</h3>
            <button
              onClick={() => setActiveSection("wishlist")}
              className="text-sm text-primary hover:text-primary-dark flex items-center"
            >
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          {wishlist && wishlist.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {wishlist.slice(0, 3).map((item) => (
                <div
                  key={item._id}
                  className="border border-border-primary rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="relative h-40">
                    <Image
                      src={item.productId.images?.[0]?.url || "/images/placeholder.jpg"}
                      alt={item.productId.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h4 className="font-medium text-text-primary mb-1 line-clamp-1">
                      {item.productId.name}
                    </h4>
                    <p className="text-primary font-bold">฿{item.productId.price.toFixed(2)}</p>
                    <div className="flex mt-2 space-x-2">
                      <button
                        onClick={() => {
                          // Add to cart logic
                        }}
                        className="flex-1 px-3 py-1.5 bg-primary text-text-inverted rounded-md text-sm hover:bg-primary-hover flex items-center justify-center"
                      >
                        <FaShoppingCart className="mr-1" /> Add to Cart
                      </button>
                      <button
                        onClick={() => {
                          // Remove from wishlist logic
                        }}
                        className="px-3 py-1.5 border border-border-primary rounded-md text-sm hover:bg-background-secondary"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FaHeart}
              title="Your Wishlist is Empty"
              description="Save items you like for future reference."
              action={{
                label: "Explore Products",
                onClick: () => router.push("/"),
              }}
            />
          )}
        </Card>
      </div>

      <OrderInfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        order={selectedOrder}
      />
    </>
  );
};

export const OrdersSection = ({ session }) => {
  const { orders, isLoading, isError, pagination, changePage, refetch: refetchOrders } = useOrders();
  const router = useRouter();
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  // Check if order has items that need reviews
  const orderNeedsReviews = (order) => {
    if (order.status !== "delivered") return false;
    return order.items.some(item => !item.reviewStatus);
  };

  // Count items that need reviews in an order
  const countItemsNeedingReview = (order) => {
    if (order.status !== "delivered") return 0;
    return order.items.filter(item => !item.reviewStatus).length;
  };

  // Check if any orders need reviews
  const hasOrdersNeedingReviews = useMemo(() => {
    if (!orders || orders.length === 0) return false;
    return orders.some(orderNeedsReviews);
  }, [orders]);

  // Count total items needing reviews
  const totalItemsNeedingReviews = useMemo(() => {
    if (!orders || orders.length === 0) return 0;
    return orders.reduce((total, order) => {
      return total + countItemsNeedingReview(order);
    }, 0);
  }, [orders]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    } else if (sortConfig.key === key && sortConfig.direction === 'descending') {
      direction = null;
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'ascending' ? <FaSortUp className="inline ml-1" /> : <FaSortDown className="inline ml-1" />;
  };

  const sortedOrders = useMemo(() => {
    let sortableOrders = [...(orders || [])];
    if (sortConfig.key && sortConfig.direction) {
      sortableOrders.sort((a, b) => {
        if (sortConfig.key === 'createdAt') {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          
          if (sortConfig.direction === 'ascending') {
            return dateA - dateB;
          }
          return dateB - dateA;
        } else if (sortConfig.key === 'totalAmount') {
          if (sortConfig.direction === 'ascending') {
            return a.totalAmount - b.totalAmount;
          }
          return b.totalAmount - a.totalAmount;
        } else {
          if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (a[sortConfig.key] > b[sortConfig.key]) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
          return 0;
        }
      });
    }
    return sortableOrders;
  }, [orders, sortConfig]);

  const handleReviewClick = (product, orderId) => {
    console.log("Review click with product:", product, "orderId:", orderId);
    
    // Enhanced validation to handle all possible product data structures
    if (!product) {
      toast.error("Cannot open review form: Product information is missing");
      return;
    }
    
    if (!orderId) {
      toast.error("Cannot open review form: Order information is missing");
      return;
    }
    
    // Normalize the product object structure to ensure consistency
    // This handles all possible formats of product data
    const normalizedProduct = {
      _id: product._id || 
           (typeof product.productId === 'object' ? product.productId._id : product.productId) ||
           (typeof product.product === 'object' ? product.product._id : product.product),
      name: product.name || 
            (typeof product.productId === 'object' ? product.productId.name : null) ||
            (typeof product.product === 'object' ? product.product.name : null) ||
            "Unknown Product",
      images: product.images || 
              (typeof product.productId === 'object' && product.productId.images ? product.productId.images : null) ||
              (typeof product.product === 'object' && product.product.images ? product.product.images : null) ||
              (product.image ? [{ url: product.image }] : [{ url: "/images/placeholder.jpg" }]),
    };
    
    console.log("Normalized product:", normalizedProduct);
    
    if (!normalizedProduct._id) {
      toast.error("Cannot open review form: Invalid product ID");
      return;
    }
  
    setSelectedProduct(normalizedProduct);
    setSelectedOrderId(orderId);
    setReviewModalOpen(true);
  };

  const handleOpenInfoModal = (order) => {
    setSelectedOrder(order);
    setIsInfoModalOpen(true);
  };

  // Listen for events from the OrderInfoModal
  useEffect(() => {
    const handleOpenReviewModal = (e) => {
      const { product, orderId } = e.detail;
      handleReviewClick(product, orderId);
    };

    document.addEventListener('openReviewModal', handleOpenReviewModal);
    return () => {
      document.removeEventListener('openReviewModal', handleOpenReviewModal);
    };
  }, []);

  const orderColumns = [
    { 
      header: "Order ID", 
      accessor: "orderId", 
      className: "font-medium text-primary",
      sortable: true,
      onClick: () => requestSort("orderId"),
      headerContent: () => (
        <>Order ID {getSortIcon("orderId")}</>
      )
    },
    {
      header: "Date",
      accessor: "createdAt",
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
      sortable: true,
      onClick: () => requestSort("createdAt"),
      headerContent: () => (
        <>Date {getSortIcon("createdAt")}</>
      )
    },
    { 
      header: "Status", 
      accessor: "status", 
      render: (row) => (
        <div className="flex items-center">
          <OrderStatus status={row.status} />
          {row.status === "delivered" && orderNeedsReviews(row) && (
            <span className="ml-2 text-amber-500">
              <FaStar className="inline-block" title="Reviews needed" />
            </span>
          )}
        </div>
      ),
      sortable: true,
      onClick: () => requestSort("status"),
      headerContent: () => (
        <>Status {getSortIcon("status")}</>
      )
    },
    {
      header: "Info",
      accessor: "items",
      render: (row) => (
        <div className="flex flex-col">
          <div className="flex items-center mb-1">
            {row.items.slice(0, 3).map((item, index) => (
              <div
                key={index}
                className="w-8 h-8 rounded-full overflow-hidden border-2 border-background -ml-2 first:ml-0"
              >
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={32}
                    height={32}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-background-secondary flex items-center justify-center">
                    <FaBox className="text-text-muted text-xs" />
                  </div>
                )}
              </div>
            ))}
            {row.items.length > 3 && (
              <div className="w-8 h-8 rounded-full bg-background-secondary border-2 border-background -ml-2 flex items-center justify-center">
                <span className="text-xs text-text-muted">+{row.items.length - 3}</span>
              </div>
            )}
          </div>
          <div className="text-xs text-text-secondary">
            {row.items.map(item => item.name).slice(0, 2).join(", ")}
            {row.items.length > 2 ? ` and ${row.items.length - 2} more` : ""}
          </div>
          <button
            onClick={() => handleOpenInfoModal(row)}
            className="text-xs text-primary hover:text-primary-dark mt-1 flex items-center"
          >
            <FaInfoCircle className="mr-1" /> Details
          </button>
          {row.status === "delivered" && orderNeedsReviews(row) && (
            <div className="text-xs text-amber-500 mt-1">
              {countItemsNeedingReview(row)} item(s) need review
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Total",
      accessor: "totalAmount",
      render: (row) => `฿${row.totalAmount.toFixed(2)}`,
      sortable: true,
      onClick: () => requestSort("totalAmount"),
      headerContent: () => (
        <>Total {getSortIcon("totalAmount")}</>
      )
    },
    {
      header: "Actions",
      accessor: "actions",
      render: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleOpenInfoModal(row)}
            className="px-3 py-1 bg-background-secondary text-text-primary text-sm rounded-md hover:bg-background-hover transition-colors"
          >
            View
          </button>
          {row.status === "delivered" && orderNeedsReviews(row) && (
            <button
              onClick={() => handleOpenInfoModal(row)}
              className="px-3 py-1 bg-amber-500 text-white text-sm rounded-md hover:bg-amber-600 transition-colors flex items-center"
            >
              <FaStar className="mr-1" /> Review
            </button>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return (
      <div className="text-center py-8">
        <p className="text-error mb-4">Failed to load orders</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-text-inverted rounded-lg hover:bg-primary-dark transition-colors duration-300"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <SectionHeader
          title="My Orders"
          description="Track and manage your orders"
        />

        {hasOrdersNeedingReviews && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-md mb-4 dark:bg-amber-900/20 dark:border-amber-600">
            <div className="flex items-center">
              <FaBell className="text-amber-500 mr-3" />
              <div>
                <h3 className="font-medium text-amber-800 dark:text-amber-400">Reviews Needed</h3>
                <p className="text-amber-700 dark:text-amber-300 text-sm">
                  You have {totalItemsNeedingReviews} item{totalItemsNeedingReviews !== 1 ? 's' : ''} from delivered orders that {totalItemsNeedingReviews !== 1 ? 'need' : 'needs'} your review.
                </p>
              </div>
            </div>
          </div>
        )}

        <Card>
          {orders && orders.length > 0 ? (
            <>
              <DataTable
                columns={orderColumns}
                data={sortedOrders}
                keyField="_id"
                emptyMessage="No orders found"
              />
              <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-text-secondary">
                  Showing {pagination.page} of {pagination.totalPages} pages
                </div>
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={changePage}
                />
              </div>
            </>
          ) : (
            <EmptyState
              icon={FaShoppingBag}
              title="No Orders Yet"
              description="Your order history will appear here once you make a purchase."
              action={{
                label: "Start Shopping",
                onClick: () => router.push("/"),
              }}
            />
          )}
        </Card>
      </div>

      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        product={selectedProduct}
        orderId={selectedOrderId}
      />

      <OrderInfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        order={selectedOrder}
      />
    </>
  );
};

export const WishlistSection = ({ session, onAddToCart }) => {
  const { wishlist, isLoading, isError, pagination, changePage, toggleWishlistItem } = useWishlist();
  const router = useRouter();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { cartItems } = useCart(); // Use CartContext to check cart status

  // Animation variants from Product.jsx
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const handleRemoveFromWishlist = async (productId) => {
    try {
      await toggleWishlistItem(productId);
    } catch (error) {
      toast.error("Failed to remove from wishlist");
    }
  };

  const handleAddToCart = async (product) => {
    if (!product._id) {
      console.error("Invalid product _id:", product);
      toast.error("Cannot add to cart: Invalid product");
      return;
    }

    try {
      const cartItem = {
        id: product._id,
        productId: product._id, // Match cartItems key
        name: product.name,
        price: product.price,
        image: product.images[0]?.url || "/images/placeholder.jpg",
        category: product.categories[0]?.name || product.categories[0] || "",
      };
      console.log("Adding to cart:", cartItem);
      await onAddToCart(cartItem);
      toast.success(
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 relative rounded overflow-hidden">
            <Image
              src={product.images[0]?.url || "/images/placeholder.jpg"}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <p className="font-medium text-text-primary">{product.name}</p>
            <p className="text-sm text-text-muted">Added to cart</p>
          </div>
        </div>
      );
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Failed to add to cart");
    }
  };

  const handleProductClick = (product) => {
    if (!product._id) {
      console.error("Invalid product _id for modal:", product);
      toast.error("Cannot view product: Invalid product");
      return;
    }
    setSelectedProduct(product);
  };

  const isProductInCart = (productId) => {
    return cartItems.some((item) => item.productId === productId || item.id === productId);
  };

  const getProductQuantityInCart = (productId) => {
    const item = cartItems.find((item) => item.productId === productId || item.id === productId);
    return item ? item.quantity : 0;
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return (
      <div className="text-center py-8">
        <p className="text-error mb-4">Failed to load wishlist</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-text-inverted rounded-lg hover:bg-primary-dark transition-colors duration-300"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <SectionHeader title="Your Wishlist" />
      <Card>
        {wishlist?.length > 0 ? (
          <>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 p-4"
            >
              {wishlist.map((item, index) => {
                const product = item; // Use item directly as it contains all product data
                if (!product._id) {
                  console.warn("Skipping product with missing _id:", product);
                  return null;
                }
                return (
                  <motion.div
                    key={product._id}
                    id={`wishlist-product-${product._id}`}
                    variants={fadeInUp}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ y: -5 }}
                    className="group relative bg-surface-card rounded-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md"
                  >
                    <div
                      className="aspect-square relative overflow-hidden cursor-pointer"
                      onClick={() => handleProductClick(product)}
                    >
                      <Image
                        src={product.images[0]?.url || "/images/placeholder.jpg"}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute top-3 right-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFromWishlist(product._id);
                          }}
                          className="p-2 rounded-full bg-surface-card opacity-90 backdrop-blur-sm hover:bg-surface-card transition-colors duration-200"
                        >
                          <Heart
                            className="w-5 h-5 text-error"
                            fill="currentColor"
                          />
                        </button>
                      </div>
                      {product.quantity <= 0 && !product.continueSellingWhenOutOfStock && (
                        <div className="absolute top-0 left-0 w-full bg-error/90 text-text-inverted text-center py-1 text-sm font-medium">
                          Out of Stock
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <div className="flex justify-between items-start mb-2">
                        <h3
                          className="font-medium text-text-primary line-clamp-1 cursor-pointer"
                          onClick={() => handleProductClick(product)}
                        >
                          {product.name}
                        </h3>
                        <span className="font-bold text-primary">฿{product.price.toFixed(2)}</span>
                      </div>
                      <p className="text-sm text-text-muted line-clamp-2 mb-2 min-h-[40px]">
                        {product.shortDescription || product.description}
                      </p>
                      <div className="flex items-center mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.round(product.averageRating || 0)
                                ? "text-warning fill-current"
                                : "text-text-muted"
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-xs text-text-secondary">
                          ({product.averageRating?.toFixed(1) || "0"})
                        </span>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleAddToCart(product)}
                        disabled={product.quantity <= 0 && !product.continueSellingWhenOutOfStock}
                        className={`w-full flex items-center justify-center px-4 py-2 rounded-full transition-colors duration-200 ${
                          isProductInCart(product._id)
                            ? "bg-primary-dark text-text-inverted"
                            : product.quantity <= 0 && !product.continueSellingWhenOutOfStock
                            ? "bg-background-secondary text-text-muted cursor-not-allowed"
                            : "bg-primary text-text-inverted hover:bg-primary-dark"
                        }`}
                      >
                        {isProductInCart(product._id) ? (
                          <>
                            <ShoppingBag className="w-4 h-4" />
                            <span className="text-xs mr-1">{getProductQuantityInCart(product._id)}</span>
                            <span className="text-sm">In Cart</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-4 h-4 mr-1" />
                            <span className="text-sm">Add To Cart</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={changePage}
            />
          </>
        ) : (
          <EmptyState
            icon={FaHeart}
            title="Your Wishlist is Empty"
            description="Save items you love to your wishlist and find them here."
            actionText="Browse Products"
            onAction={() => router.push("/")}
          />
        )}
      </Card>

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          keyword={selectedProduct.name}
        />
      )}
    </>
  );
};

export const ReviewsSection = ({ session }) => {
  const { reviews, isLoading, isError, pagination, changePage } = useUserReviews();
  const router = useRouter();
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [editReviewModalOpen, setEditReviewModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);

  // Validate ObjectId format
  const isValidObjectId = (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id);
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    } else if (sortConfig.key === key && sortConfig.direction === 'descending') {
      direction = null;
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'ascending' ? <FaSortUp className="inline ml-1" /> : <FaSortDown className="inline ml-1" />;
  };

  const sortedReviews = useMemo(() => {
    let sortableReviews = [...(reviews || [])];
    if (sortConfig.key && sortConfig.direction) {
      sortableReviews.sort((a, b) => {
        if (sortConfig.key === 'createdAt') {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          
          if (sortConfig.direction === 'ascending') {
            return dateA - dateB;
          }
          return dateB - dateA;
        } else if (sortConfig.key === 'rating') {
          if (sortConfig.direction === 'ascending') {
            return a.rating - b.rating;
          }
          return b.rating - a.rating;
        } else if (sortConfig.key === 'productId.name') {
          const nameA = a.productId?.name || '';
          const nameB = b.productId?.name || '';
          if (sortConfig.direction === 'ascending') {
            return nameA.localeCompare(nameB);
          }
          return nameB.localeCompare(nameA);
        } else {
          if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (a[sortConfig.key] > b[sortConfig.key]) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
          return 0;
        }
      });
    }
    return sortableReviews;
  }, [reviews, sortConfig]);

  const handleEditReview = (review) => {
    if (!review?.productId?._id || !review?._id) {
      toast.error("Cannot edit review: Invalid product or review information");
      return;
    }

    setSelectedReview({
      _id: review.productId._id,
      name: review.productId.name || "Unknown Product",
      images: review.productId.images?.length > 0 
        ? review.productId.images 
        : [{ url: "/images/placeholder.jpg" }],
      reviewId: review._id,
      orderId: review.orderId,
      initialRating: review.rating,
      initialTitle: review.title,
      initialComment: review.comment,
      initialImages: review.images || [],
    });
    setEditReviewModalOpen(true);
  };

  const reviewColumns = [
    {
      header: "Product",
      accessor: "productId",
      render: (row) => (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0 relative rounded-md overflow-hidden">
            <Image
              src={row.productId?.images?.[0]?.url || "/images/placeholder.jpg"}
              alt={row.productId?.name || "Product"}
              fill
              className="object-cover"
            />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-text-primary">{row.productId?.name || "Unknown Product"}</div>
          </div>
        </div>
      ),
      sortable: true,
      onClick: () => requestSort("productId.name"),
      headerContent: () => (
        <>Product {getSortIcon("productId.name")}</>
      )
    },
    {
      header: "Rating",
      accessor: "rating",
      render: (row) => (
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <FaStar
              key={star}
              className={star <= row.rating ? "text-yellow-400" : "text-gray-300"}
              size={16}
            />
          ))}
        </div>
      ),
      sortable: true,
      onClick: () => requestSort("rating"),
      headerContent: () => (
        <>Rating {getSortIcon("rating")}</>
      )
    },
    {
      header: "Review",
      accessor: "comment",
      render: (row) => (
        <div>
          {row.title && <div className="font-medium">{row.title}</div>}
          <div className="text-sm text-text-secondary line-clamp-2">{row.comment}</div>
          {row.images && row.images.length > 0 && (
            <div className="flex mt-1 space-x-1">
              {row.images.slice(0, 3).map((image, idx) => (
                <div key={idx} className="h-6 w-6 relative rounded overflow-hidden">
                  <Image src={image} alt={`Review image ${idx + 1}`} fill className="object-cover" />
                </div>
              ))}
              {row.images.length > 3 && (
                <div className="h-6 w-6 bg-background-secondary rounded flex items-center justify-center text-xs">
                  +{row.images.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => (
        <Badge
          color={
            row.status === "approved"
              ? "success"
              : row.status === "pending"
              ? "warning"
              : "error"
          }
        >
          {row.status}
        </Badge>
      ),
      sortable: true,
      onClick: () => requestSort("status"),
      headerContent: () => (
        <>Status {getSortIcon("status")}</>
      )
    },
    {
      header: "Date",
      accessor: "createdAt",
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
      sortable: true,
      onClick: () => requestSort("createdAt"),
      headerContent: () => (
        <>Date {getSortIcon("createdAt")}</>
      )
    },
    {
      header: "Actions",
      accessor: "actions",
      render: (row) => (
        <button
          onClick={() => handleEditReview(row)}
          className="text-primary hover:text-primary-dark text-sm"
          disabled={row.status !== "approved" && row.status !== "pending"}
        >
          Edit
        </button>
      ),
    },
  ];

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return (
      <div className="text-center py-8">
        <p className="text-error mb-4">Failed to load reviews</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-text-inverted rounded-lg hover:bg-primary-dark transition-colors duration-300"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <SectionHeader title="Your Reviews" />
      <Card>
        {reviews?.length > 0 ? (
          <>
            <DataTable
              columns={reviewColumns}
              data={sortedReviews}
              emptyMessage="You haven't written any reviews yet."
            />
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={changePage}
            />
          </>
        ) : (
          <EmptyState
            icon={FaStar}
            title="No Reviews Yet"
            description="Your reviews will appear here after you review purchased products."
            actionText="Browse Products"
            onAction={() => router.push("/")}
          />
        )}
      </Card>

      {/* Edit Review Modal */}
      {editReviewModalOpen && selectedReview && (
        <ReviewModal
          isOpen={editReviewModalOpen}
          onClose={() => {
            setEditReviewModalOpen(false);
            setSelectedReview(null);
          }}
          product={{
            _id: selectedReview._id,
            name: selectedReview.name,
            images: selectedReview.images,
          }}
          orderId={selectedReview.orderId}
          initialReview={{
            rating: selectedReview.initialRating,
            title: selectedReview.initialTitle,
            comment: selectedReview.initialComment,
            images: selectedReview.initialImages,
          }}
          isEditMode={true}
          reviewId={selectedReview.reviewId}
        />
      )}
    </>
  );
};

export const ShipmentsSection = ({ session }) => {
  const { orders, isLoading, isError } = useOrders();
  const router = useRouter();
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    } else if (sortConfig.key === key && sortConfig.direction === 'descending') {
      direction = null;
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'ascending' ? <FaSortUp className="inline ml-1" /> : <FaSortDown className="inline ml-1" />;
  };

  // Filter orders that are shipped or in transit
  const shipments = useMemo(() => {
    return orders?.filter((order) => ["processing", "shipped"].includes(order.status)) || [];
  }, [orders]);

  const sortedShipments = useMemo(() => {
    let sortableShipments = [...shipments];
    if (sortConfig.key && sortConfig.direction) {
      sortableShipments.sort((a, b) => {
        if (sortConfig.key === 'createdAt') {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          
          if (sortConfig.direction === 'ascending') {
            return dateA - dateB;
          }
          return dateB - dateA;
        } else if (sortConfig.key === 'estimatedDelivery') {
          const dateA = a.estimatedDelivery ? new Date(a.estimatedDelivery) : new Date();
          const dateB = b.estimatedDelivery ? new Date(b.estimatedDelivery) : new Date();
          
          if (sortConfig.direction === 'ascending') {
            return dateA - dateB;
          }
          return dateB - dateA;
        } else {
          if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (a[sortConfig.key] > b[sortConfig.key]) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
          return 0;
        }
      });
    }
    return sortableShipments;
  }, [shipments, sortConfig]);

  const shipmentColumns = [
    { 
      header: "Order ID", 
      accessor: "orderId", 
      className: "font-medium text-primary",
      sortable: true,
      onClick: () => requestSort("orderId"),
      headerContent: () => (
        <>Order ID {getSortIcon("orderId")}</>
      )
    },
    {
      header: "Date",
      accessor: "createdAt",
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
      sortable: true,
      onClick: () => requestSort("createdAt"),
      headerContent: () => (
        <>Date {getSortIcon("createdAt")}</>
      )
    },
    { 
      header: "Status", 
      accessor: "status", 
      render: (row) => <OrderStatus status={row.status} />,
      sortable: true,
      onClick: () => requestSort("status"),
      headerContent: () => (
        <>Status {getSortIcon("status")}</>
      )
    },
    {
      header: "Info",
      accessor: "items",
      render: (row) => (
        <div className="flex flex-col">
          <div className="flex items-center mb-1">
            {row.items.slice(0, 3).map((item, index) => (
              <div
                key={index}
                className="w-8 h-8 rounded-full overflow-hidden border-2 border-background -ml-2 first:ml-0"
              >
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={32}
                    height={32}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-background-secondary flex items-center justify-center">
                    <FaBox className="text-text-muted text-xs" />
                  </div>
                )}
              </div>
            ))}
            {row.items.length > 3 && (
              <div className="w-8 h-8 rounded-full bg-background-secondary border-2 border-background -ml-2 flex items-center justify-center">
                <span className="text-xs text-text-muted">+{row.items.length - 3}</span>
              </div>
            )}
          </div>
          <div className="text-xs text-text-secondary">
            {row.items.map(item => item.name).slice(0, 2).join(", ")}
            {row.items.length > 2 ? ` and ${row.items.length - 2} more` : ""}
          </div>
          <div className="text-xs mt-1">
            <span className="font-medium">Shipping:</span> {row.shippingMethod || "Standard"}
          </div>
          {row.trackingNumber && (
            <div className="text-xs">
              <span className="font-medium">Tracking:</span> {row.trackingNumber}
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Estimated Delivery",
      accessor: "estimatedDelivery",
      render: (row) => (
        <span className="text-text-secondary">
          {row.estimatedDelivery
            ? new Date(row.estimatedDelivery).toLocaleDateString()
            : "Calculating..."}
        </span>
      ),
      sortable: true,
      onClick: () => requestSort("estimatedDelivery"),
      headerContent: () => (
        <>Estimated Delivery {getSortIcon("estimatedDelivery")}</>
      )
    },
  ];

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return (
      <div className="text-center py-8">
        <p className="text-error mb-4">Failed to load shipments</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-text-inverted rounded-lg hover:bg-primary-dark transition-colors duration-300"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <SectionHeader title="Your Shipments" />
      <Card>
        {sortedShipments.length > 0 ? (
          <DataTable
            columns={shipmentColumns}
            data={sortedShipments}
            emptyMessage="No shipments found."
          />
        ) : (
          <EmptyState
            icon={MdLocalShipping}
            title="No Active Shipments"
            description="Your shipments will appear here once your orders are processed."
            actionText="View Orders"
            onAction={() => router.push("/account?tab=orders")}
          />
        )}
      </Card>
    </>
  );
};