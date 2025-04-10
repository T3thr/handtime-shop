"use client";

import React from "react";
import { motion } from "framer-motion";
import { useActiveSection } from "@/hooks/useDashboardState";
import { useSidebar } from "@/context/SidebarContext";
import { Sidebar } from "@/components/contents/EnhancedSidebar";
import { 
  OverviewSection, 
  OrdersSection, 
  WishlistSection,
  ShipmentsSection 
} from "@/components/contents/DashboardSections";
import { 
  ManageStore, 
  UserManagement, 
  OrderManagement 
} from "@/components/contents/DashboardManagement";
import { 
  ProductFormModal, 
  CategoryFormModal, 
  DeleteConfirmationModal 
} from "@/components/contents/DashboardForms";
import { useCart } from "@/context/CartContext";
import { 
  useProducts, 
  useCategories, 
  deleteProduct, 
  deleteCategory,
  useUsers,
  useAllOrders
} from "@/backend/lib/dashboardAction";
import { toast } from "react-toastify";

export default function Dashboard({ session }) {
  const [state, setState] = useActiveSection();
  const { isOpen, toggleSidebar, isCollapsed } = useSidebar();
  const [isProductModalOpen, setIsProductModalOpen] = React.useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState(null);
  const [selectedCategory, setSelectedCategory] = React.useState(null);
  const [deleteItem, setDeleteItem] = React.useState({ type: "", id: "", name: "" });
  
  const { addToCart } = useCart();
  const { categories } = useCategories();
  
  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsProductModalOpen(true);
  };
  
  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };
  
  const handleDeleteProduct = (slug) => {
    const product = categories.find(p => p.slug === slug);
    setDeleteItem({
      type: "Product",
      id: slug,
      name: product?.name || slug
    });
    setIsDeleteModalOpen(true);
  };
  
  const confirmDeleteProduct = async () => {
    try {
      await deleteProduct(deleteItem.id);
      toast.success("Product deleted successfully!");
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
      throw error;
    }
  };
  
  const handleAddCategory = () => {
    setSelectedCategory(null);
    setIsCategoryModalOpen(true);
  };
  
  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setIsCategoryModalOpen(true);
  };
  
  const handleDeleteCategory = (slug) => {
    const category = categories.find(c => c.slug === slug);
    setDeleteItem({
      type: "Category",
      id: slug,
      name: category?.name || slug
    });
    setIsDeleteModalOpen(true);
  };
  
  const confirmDeleteCategory = async () => {
    try {
      await deleteCategory(deleteItem.id);
    } catch (error) {
      console.error("Error deleting category:", error);
      throw error;
    }
  };
  
  const handleAddToCart = async (product) => {
    try {
      const cartItem = {
        id: product.productId,
        name: product.name,
        price: product.price,
        description: product.description || "",
        image: product.image || "/images/placeholder.jpg",
        category: product.category || "",
      };
      
      await addToCart(cartItem);
      toast.success(`${product.name} added to cart!`);
    } catch (error) {
      console.error("Failed to add to cart:", error);
      toast.error("Failed to add to cart");
    }
  };
  
  // Animation variants
  const contentVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };
  
  // Render the appropriate section based on active section
  const renderSection = () => {
    switch (state.activeSection) {
      case "overview":
        return <OverviewSection session={session} />;
      case "orders":
        return <OrdersSection session={session} />;
      case "wishlist":
        return <WishlistSection session={session} onAddToCart={handleAddToCart} />;
      case "shipments":
        return <ShipmentsSection session={session} />;
      case "store":
        return (
          <ManageStore
            onEditProduct={handleEditProduct}
            onDeleteProduct={handleDeleteProduct}
            onAddCategory={handleAddCategory}
            onEditCategory={handleEditCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        );
      case "users":
        return <UserManagement />;
      case "allOrders":
        return <OrderManagement />;
      case "settings":
        return (
          <div>
            <h2 className="text-2xl font-bold mb-6">Account Settings</h2>
            <p>Settings section is under development.</p>
          </div>
        );
      default:
        return <OverviewSection session={session} />;
    }
  };
  
  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        activeSection={state.activeSection}
        setActiveSection={(section) => setState({ activeSection: section })}
        session={session}
      />
      
      <main
        className={`transition-all duration-300 ${
          isOpen ? (isCollapsed ? "lg:ml-[80px]" : "lg:ml-[280px]") : "lg:ml-0"
        }`}
      >
        <div className="container mx-auto px-4 py-8">
          <motion.div
            key={state.activeSection}
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-gradient-to-br from-background to-background-secondary rounded-xl p-6 shadow-lg border border-border-primary"
          >
            {renderSection()}
          </motion.div>
        </div>
      </main>
      
      {/* Modals */}
      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        product={selectedProduct}
        categories={categories}
      />
      
      <CategoryFormModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        category={selectedCategory}
      />
      
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={deleteItem.type === "Product" ? confirmDeleteProduct : confirmDeleteCategory}
        itemType={deleteItem.type}
        itemName={deleteItem.name}
      />
    </div>
  );
}
