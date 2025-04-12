"use client";
import React, { useState, useMemo } from "react";
import { useUserData, useOrders, useWishlist } from "@/hooks/dashboardHooks";
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
import { FaShoppingBag, FaHeart, FaBox, FaTrash, FaShoppingCart, FaInfoCircle, FaSortUp, FaSortDown, FaStar } from "react-icons/fa";
import { MdLocalShipping } from "react-icons/md";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { toast } from "react-toastify";
import ReviewModal from "./ReviewModal.jsx"; // Explicit .jsx extension

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
                        // Delay to allow modal to close before opening review modal
                        setTimeout(() => {
                          document.dispatchEvent(new CustomEvent('openReviewModal', { 
                            detail: { 
                              product: { 
                                _id: item.productId, // Normalize to _id
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
            <FaInfoCircle className="mr-1" /> View Details
          </button>
        </div>
      ),
    },
    {
      header: "Total",
      accessor: "totalAmount",
      align: "right",
      render: (row) => <span className="font-medium">฿{row.totalAmount.toFixed(2)}</span>,
      sortable: true,
      onClick: () => requestSort("totalAmount"),
      headerContent: () => (
        <>Total {getSortIcon("totalAmount")}</>
      )
    },
  ];

  return (
    <>
      <SectionHeader
        title="Dashboard Overview"
        subtitle={`Welcome, ${session.user.name.split(" ")[0]}!`}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <DashboardCard key={index} {...stat} />
        ))}
      </div>
      <Card className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-text-primary">Recent Orders</h3>
          <button
            onClick={() => setActiveSection("orders")}
            className="text-sm text-primary hover:underline flex items-center"
          >
            View all orders
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 ml-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
        <DataTable
          columns={orderColumns}
          data={sortedOrders?.slice(0, 2) || []}
          emptyMessage="No orders found."
        />
      </Card>

      {/* Order Info Modal */}
      <OrderInfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        order={selectedOrder}
      />
    </>
  );
};

export const OrdersSection = ({ session }) => {
  const { orders, isLoading, isError, pagination, changePage } = useOrders();
  const router = useRouter();
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

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
    // Normalize product to ensure _id
    const normalizedProduct = {
      _id: product.productId,
      name: product.name,
      images: product.image ? [{ url: product.image }] : [],
    };
    setSelectedProduct(normalizedProduct);
    setSelectedOrderId(orderId);
    setReviewModalOpen(true);
  };

  const handleOpenInfoModal = (order) => {
    setSelectedOrder(order);
    setIsInfoModalOpen(true);
  };

  // Listen for events from the OrderInfoModal
  React.useEffect(() => {
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
            <FaInfoCircle className="mr-1" /> View Details
          </button>
        </div>
      ),
    },
    {
      header: "Total",
      accessor: "totalAmount",
      align: "right",
      render: (row) => <span className="font-medium">฿{row.totalAmount.toFixed(2)}</span>,
      sortable: true,
      onClick: () => requestSort("totalAmount"),
      headerContent: () => (
        <>Total {getSortIcon("totalAmount")}</>
      )
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
      <SectionHeader title="Your Orders" />
      <Card>
        {orders?.length > 0 ? (
          <>
            <DataTable columns={orderColumns} data={sortedOrders} emptyMessage="No orders found." />
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={changePage}
            />
          </>
        ) : (
          <EmptyState
            icon={FaShoppingBag}
            title="No Orders Yet"
            description="Your order history will appear here once you make a purchase."
            actionText="Browse Products"
            onAction={() => router.push("/")}
          />
        )}
      </Card>

      {/* Review Modal */}
      {reviewModalOpen && selectedProduct && (
        <ReviewModal
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          product={selectedProduct}
          orderId={selectedOrderId}
        />
      )}

      {/* Order Info Modal */}
      <OrderInfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        order={selectedOrder}
      />
    </>
  );
};

export const WishlistSection = ({ session, onRemoveFromWishlist, onAddToCart }) => {
  const { wishlist, isLoading, isError, pagination, changePage, toggleWishlistItem } = useWishlist();
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

  const sortedWishlist = useMemo(() => {
    let sortableWishlist = [...(wishlist || [])];
    if (sortConfig.key && sortConfig.direction) {
      sortableWishlist.sort((a, b) => {
        if (sortConfig.key === 'createdAt') {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          
          if (sortConfig.direction === 'ascending') {
            return dateA - dateB;
          }
          return dateB - dateA;
        } else if (sortConfig.key === 'price') {
          const priceA = a.productId?.price || 0;
          const priceB = b.productId?.price || 0;
          
          if (sortConfig.direction === 'ascending') {
            return priceA - priceB;
          }
          return priceB - priceA;
        } else {
          const valueA = a.productId?.[sortConfig.key] || '';
          const valueB = b.productId?.[sortConfig.key] || '';
          
          if (valueA < valueB) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (valueA > valueB) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
          return 0;
        }
      });
    }
    return sortableWishlist;
  }, [wishlist, sortConfig]);

  const handleRemoveFromWishlist = async (productId) => {
    try {
      await toggleWishlistItem(productId);
      toast.success("Item removed from wishlist");
    } catch (error) {
      toast.error("Failed to remove from wishlist");
    }
  };

  const handleAddToCart = async (product) => {
    try {
      const cartItem = {
        id: product._id,
        name: product.name,
        price: product.price,
        image: product.images[0]?.url || "/images/placeholder.jpg",
        category: product.categories[0] || "",
      };

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
      toast.error("Failed to add to cart");
    }
  };

  const wishlistColumns = [
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
            <div className="text-sm font-medium text-text-primary">{row.productId?.name || "Product"}</div>
            <div className="text-xs text-text-secondary">
              {row.productId?.categories?.map((cat) => cat.name || cat).join(", ") || "Uncategorized"}
            </div>
          </div>
        </div>
      ),
      sortable: true,
      onClick: () => requestSort("name"),
      headerContent: () => (
        <>Product {getSortIcon("name")}</>
      )
    },
    {
      header: "Price",
      accessor: "price",
      render: (row) => (
        <span className="font-medium text-primary">
          ฿{row.productId?.price?.toFixed(2) || "0.00"}
        </span>
      ),
      sortable: true,
      onClick: () => requestSort("price"),
      headerContent: () => (
        <>Price {getSortIcon("price")}</>
      )
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => (
        <Badge
          color={
            row.productId?.quantity > 0 || row.productId?.continueSellingWhenOutOfStock
              ? "success"
              : "error"
          }
        >
          {row.productId?.quantity > 0 || row.productId?.continueSellingWhenOutOfStock
            ? "In Stock"
            : "Out of Stock"}
        </Badge>
      ),
      sortable: true,
      onClick: () => requestSort("quantity"),
      headerContent: () => (
        <>Status {getSortIcon("quantity")}</>
      )
    },
    {
      header: "Added On",
      accessor: "createdAt",
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
      sortable: true,
      onClick: () => requestSort("createdAt"),
      headerContent: () => (
        <>Added On {getSortIcon("createdAt")}</>
      )
    },
    {
      header: "Actions",
      accessor: "actions",
      render: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleAddToCart(row.productId)}
            disabled={
              row.productId?.quantity <= 0 && !row.productId?.continueSellingWhenOutOfStock
            }
            className={`p-2 rounded-md ${
              row.productId?.quantity <= 0 && !row.productId?.continueSellingWhenOutOfStock
                ? "bg-background-secondary text-text-muted cursor-not-allowed"
                : "bg-primary text-text-inverted hover:bg-primary-dark"
            }`}
            title="Add to Cart"
          >
            <FaShoppingCart size={14} />
          </button>
          <button
            onClick={() => handleRemoveFromWishlist(row.productId?._id)}
            className="p-2 rounded-md bg-error text-text-inverted hover:bg-error-dark"
            title="Remove from Wishlist"
          >
            <FaTrash size={14} />
          </button>
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
            <DataTable
              columns={wishlistColumns}
              data={sortedWishlist}
              emptyMessage="Your wishlist is empty."
            />
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
    </>
  );
};

export const ReviewsSection = ({ session }) => {
  const { reviews, isLoading, isError, pagination, changePage } = useReviews();
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
            <div className="text-sm font-medium text-text-primary">{row.productId?.name || "Product"}</div>
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