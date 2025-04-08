"use client";

import React from "react";
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
  Pagination
} from "@/components/contents/DashboardUI";
import { FaShoppingBag, FaHeart, FaBox, FaTrash, FaShoppingCart } from "react-icons/fa";
import { MdLocalShipping } from "react-icons/md";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { toast } from "react-toastify";

export const OverviewSection = ({ session }) => {
  const { userData, isLoading: userLoading, isError: userError } = useUserData();
  const { orders, isLoading: ordersLoading, isError: ordersError } = useOrders(1, 5); // Only fetch first 5 orders for overview
  const { wishlist, isLoading: wishlistLoading, isError: wishlistError } = useWishlist();
  const router = useRouter();

  const isLoading = userLoading || ordersLoading || wishlistLoading;
  
  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (userError || ordersError || wishlistError) {
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

  // Stats for dashboard cards
  const stats = [
    { icon: FaShoppingBag, title: "Total Orders", value: userData?.stats?.totalOrders || 0, color: "text-primary" },
    { icon: FaHeart, title: "Wishlist Items", value: wishlist?.length || 0, color: "text-error" },
    { icon: MdLocalShipping, title: "In Transit", value: orders?.filter((o) => o.status === "shipped").length || 0, color: "text-purple-400" },
    { icon: FaBox, title: "Delivered", value: orders?.filter((o) => o.status === "delivered").length || 0, color: "text-success" },
  ];

  const orderColumns = [
    { header: "Order ID", accessor: "orderId", className: "font-medium text-primary" },
    { header: "Date", accessor: "createdAt", render: (row) => new Date(row.createdAt).toLocaleDateString() },
    { header: "Status", accessor: "status", render: (row) => <OrderStatus status={row.status} /> },
    { header: "Items", accessor: "items", render: (row) => (
      <div className="flex items-center">
        {row.items.slice(0, 3).map((item, index) => (
          <div key={index} className="w-8 h-8 rounded-full overflow-hidden border-2 border-background -ml-2 first:ml-0">
            {item.product && item.product.image ? (
              <Image 
                src={item.product.image} 
                alt={item.product.name} 
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
    )},
    { header: "Total", accessor: "totalAmount", align: "right", render: (row) => (
      <span className="font-medium">฿{row.totalAmount.toFixed(2)}</span>
    )},
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
            onClick={() => router.push('/orders')}
            className="text-sm text-primary hover:underline flex items-center"
          >
            View all orders
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <DataTable 
          columns={orderColumns} 
          data={orders?.slice(0, 5) || []} 
          emptyMessage="No orders found."
        />
      </Card>
    </>
  );
};

export const OrdersSection = ({ session }) => {
  const { orders, isLoading, isError, pagination, changePage } = useOrders();
  const router = useRouter();

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

  const orderColumns = [
    { header: "Order ID", accessor: "orderId", className: "font-medium text-primary" },
    { header: "Date", accessor: "createdAt", render: (row) => new Date(row.createdAt).toLocaleDateString() },
    { header: "Status", accessor: "status", render: (row) => <OrderStatus status={row.status} /> },
    { header: "Items", accessor: "items", render: (row) => (
      <div className="flex items-center">
        {row.items.slice(0, 3).map((item, index) => (
          <div key={index} className="w-8 h-8 rounded-full overflow-hidden border-2 border-background -ml-2 first:ml-0">
            {item.product && item.product.image ? (
              <Image 
                src={item.product.image} 
                alt={item.product.name} 
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
    )},
    { header: "Total", accessor: "totalAmount", align: "right", render: (row) => (
      <span className="font-medium">฿{row.totalAmount.toFixed(2)}</span>
    )},
  ];

  return (
    <>
      <SectionHeader title="Your Orders" />
      <Card>
        {orders?.length > 0 ? (
          <>
            <DataTable 
              columns={orderColumns} 
              data={orders} 
              emptyMessage="No orders found."
            />
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
            onAction={() => router.push('/')}
          />
        )}
      </Card>
    </>
  );
};

export const WishlistSection = ({ session, onRemoveFromWishlist, onAddToCart }) => {
  const { wishlist, isLoading, isError, pagination, changePage, toggleWishlistItem } = useWishlist();
  const router = useRouter();

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

  const handleRemoveFromWishlist = async (productId) => {
    try {
      await toggleWishlistItem(productId);
    } catch (error) {
      console.error("Failed to remove from wishlist:", error);
      toast.error("Failed to remove from wishlist");
    }
  };

  return (
    <>
      <SectionHeader title="Your Wishlist" />
      {wishlist?.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((item) => (
              <WishlistItem 
                key={item.productId}
                item={item}
                onRemove={handleRemoveFromWishlist}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
          <div className="mt-6">
            <Pagination 
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={changePage}
            />
          </div>
        </>
      ) : (
        <Card>
          <EmptyState 
            icon={FaHeart}
            title="Your Wishlist is Empty"
            description="Save items you love to your wishlist and find them here later."
            actionText="Browse Products"
            onAction={() => router.push('/')}
          />
        </Card>
      )}
    </>
  );
};

// Helper component for wishlist items
const WishlistItem = ({ item, onRemove, onAddToCart }) => {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-surface-card p-4 rounded-xl shadow-md border border-border-primary hover:shadow-lg transition-all duration-300"
    >
      <div className="relative h-48 mb-4 rounded-lg overflow-hidden bg-background-secondary">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FaBox className="text-text-muted text-4xl" />
          </div>
        )}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onRemove(item.productId)}
          className="absolute top-2 right-2 p-2 bg-background/80 backdrop-blur-sm rounded-full text-error hover:bg-background transition-colors duration-200"
        >
          <FaTrash className="w-4 h-4" />
        </motion.button>
      </div>
      <h3 className="font-medium text-text-primary mb-1">{item.name}</h3>
      <p className="text-text-muted text-sm mb-2">{item.category}</p>
      <div className="flex justify-between items-center">
        <span className="font-bold text-text-primary">฿{item.price?.toFixed(2) || "N/A"}</span>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onAddToCart(item)}
          className="px-3 py-1 bg-primary text-text-inverted rounded-lg hover:bg-primary-dark transition-colors duration-300 text-sm shadow-md flex items-center"
        >
          <FaShoppingCart className="mr-1" /> Add to Cart
        </motion.button>
      </div>
      {item.status !== "active" && (
        <Badge color="warning" className="mt-2">
          {item.status === "draft" ? "Not Available" : "Discontinued"}
        </Badge>
      )}
    </motion.div>
  );
};

export const ShipmentsSection = ({ session }) => {
  const { orders, isLoading, isError, pagination, changePage } = useOrders();
  const router = useRouter();

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

  const shipmentColumns = [
    { header: "Order ID", accessor: "orderId", className: "font-medium text-primary" },
    { header: "Shipped Date", accessor: "shippedAt", render: (row) => new Date(row.shippedAt || row.updatedAt).toLocaleDateString() },
    { header: "Status", accessor: "status", render: (row) => <OrderStatus status={row.status} /> },
    { header: "Items", accessor: "items", render: (row) => (
      <div className="flex items-center">
        {row.items.slice(0, 3).map((item, index) => (
          <div key={index} className="w-8 h-8 rounded-full overflow-hidden border-2 border-background -ml-2 first:ml-0">
            {item.product && item.product.image ? (
              <Image 
                src={item.product.image} 
                alt={item.product.name} 
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
    )},
    { header: "Tracking", accessor: "trackingNumber", render: (row) => row.trackingNumber || "N/A" },
    { header: "Delivery", accessor: "estimatedDelivery", align: "right", render: (row) => (
      row.estimatedDelivery ? new Date(row.estimatedDelivery).toLocaleDateString() : "N/A"
    )},
  ];

  const shippedOrders = orders?.filter(o => o.status === "shipped" || o.status === "delivered") || [];

  return (
    <>
      <SectionHeader title="Your Shipments" />
      <Card>
        {shippedOrders.length > 0 ? (
          <>
            <DataTable 
              columns={shipmentColumns} 
              data={shippedOrders} 
              emptyMessage="No shipments found."
            />
            <Pagination 
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={changePage}
            />
          </>
        ) : (
          <EmptyState 
            icon={MdLocalShipping}
            title="No Shipments Yet"
            description="Your shipments will appear here once your orders are shipped."
          />
        )}
      </Card>
    </>
  );
};
