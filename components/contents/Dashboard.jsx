"use client";
import React, { useEffect } from "react"; // Add useEffect
import { motion } from "framer-motion";
import { useActiveSection } from "@/hooks/useDashboardState";
import { useSidebar } from "@/context/SidebarContext";
import { Sidebar } from "@/components/contents/EnhancedSidebar";
import { useRouter , useSearchParams } from "next/navigation"; // Add useRouter for query parsing
import { 
  OverviewSection, 
  OrdersSection, 
  WishlistSection,
  ShipmentsSection 
} from "@/components/contents/DashboardSections";
import { 
  ManageStore, 
  UserManagement, 
  OrderManagement,
  ReviewsManagement,
  BannerManagementSection
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
import { SettingsSection } from "./SettingsSection";

export default function Dashboard({ session }) {
  const [state, setState] = useActiveSection();
  const { isOpen, toggleSidebar, isCollapsed } = useSidebar();
  const [isProductModalOpen, setIsProductModalOpen] = React.useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState(null);
  const [selectedCategory, setSelectedCategory] = React.useState(null);
  const [deleteItem, setDeleteItem] = React.useState({ type: "", id: "", name: "" });
  const router = useRouter(); // Add router

  const { addToCart } = useCart();
  const { categories, refetch: refetchCategories } = useCategories();
  const { products, refetch: refetchProducts } = useProducts();

  const searchParams = useSearchParams(); // Added

  // Handle initial section from query parameter
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "wishlist") {
      setState({ activeSection: "wishlist" });
      // Clean up the URL to remove the query parameter
      router.replace("/account", { scroll: false });
    }
  }, [searchParams, setState, router]);

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsProductModalOpen(true);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  const handleDeleteProduct = (productId) => {
    const product = products?.find(p => p._id === productId) || 
                   { name: "Unknown Product", _id: productId };
    setDeleteItem({
      type: "Product",
      id: productId,
      name: product.name || productId
    });
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteProduct = async () => {
    try {
      await deleteProduct(deleteItem.id);
      refetchProducts();
      setIsDeleteModalOpen(false);
      toast.success("Product deleted successfully!");
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error(error.message || "Failed to delete product");
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

  const handleDeleteCategory = (categoryId) => {
    const category = categories?.find(c => c._id === categoryId) || 
                    { name: "Unknown Category", _id: categoryId };
    setDeleteItem({
      type: "Category",
      id: categoryId,
      name: category.name || categoryId
    });
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteCategory = async () => {
    try {
      await deleteCategory(deleteItem.id);
      refetchCategories();
      setIsDeleteModalOpen(false);
      toast.success("Category deleted successfully!");
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error(error.message || "Failed to delete category");
    }
  };

  const handleAddToCart = async (product) => {
    try {
      const cartItem = {
        id: product.productId || product._id,
        name: product.name,
        price: product.price,
        description: product.description || "",
        image: product.image || product.images?.[0]?.url || "/images/placeholder.jpg",
        category: product.category || product.categories?.[0] || "",
      };
      
      await addToCart(cartItem);
    } catch (error) {
      console.error("Failed to add to cart:", error);
      toast.error("Failed to add to cart");
    }
  };

  const handleProductFormClose = () => {
    setIsProductModalOpen(false);
    refetchProducts();
  };

  const handleCategoryFormClose = () => {
    setIsCategoryModalOpen(false);
    refetchCategories();
  };

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

  const setActiveSection = (section) => setState({ activeSection: section });

  const renderSection = () => {
    switch (state.activeSection) {
      case "overview":
        return <OverviewSection session={session} setActiveSection={setActiveSection} />;
      case "orders":
        return <OrdersSection session={session} />;
      case "wishlist":
        return <WishlistSection session={session} onAddToCart={handleAddToCart} />;
      case "shipments":
        return <ShipmentsSection session={session} />;
      case "store":
        return (
          <ManageStore
            onAddProduct={handleAddProduct}
            onEditProduct={handleEditProduct}
            onDeleteProduct={handleDeleteProduct}
            onAddCategory={handleAddCategory}
            onEditCategory={handleEditCategory}
            onDeleteCategory={handleDeleteCategory}
            products={products}
            categories={categories}
            refetchProducts={refetchProducts}
            refetchCategories={refetchCategories}
          />
        );
      case "users":
        return <UserManagement />;
      case "allOrders":
        return <OrderManagement />;
      case "allReviews":
        return <ReviewsManagement />;
      case "banners":
        return <BannerManagementSection />;
      case "settings":
        return <SettingsSection session={session} />;
      default:
        return <OverviewSection session={session} setActiveSection={setActiveSection} />;
    }
  };
  
  useEffect(() => {
    const handleSetActiveSection = (e) => {
      setActiveSection(e.detail.section);
    };
    document.addEventListener("setActiveSection", handleSetActiveSection);
    return () => document.removeEventListener("setActiveSection", handleSetActiveSection);
  }, [setActiveSection]);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        activeSection={state.activeSection}
        setActiveSection={setActiveSection}
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
      
      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={handleProductFormClose}
        product={selectedProduct}
        categories={categories}
        onSuccess={refetchProducts}
      />
      
      <CategoryFormModal
        isOpen={isCategoryModalOpen}
        onClose={handleCategoryFormClose}
        category={selectedCategory}
        onSuccess={refetchCategories}
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
