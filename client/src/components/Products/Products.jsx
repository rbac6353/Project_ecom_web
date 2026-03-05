import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import LoginPopup from '../Common/LoginPopup';
import ProductForm from '../Admin/ProductForm';
import { isProductOnDiscount, getCurrentPrice, getDiscountPercentage } from '../../utils/productDiscount';
import { useAuth } from '../../context/AuthContext';
import { authStorage } from '../../utils/authStorage';
import PageLoading from '../Common/PageLoading';

// Helper functions
const hasFreeShipping = (product) => {
  // 1. Check direct property (if backend supports it)
  if (product.freeShipping) return true;

  // 2. Check description metadata
  if (!product.description || typeof product.description !== 'string') return false;
  
  try {
    const trimmedDesc = product.description.trim();
    if (trimmedDesc.startsWith('{')) {
      const metadata = JSON.parse(trimmedDesc);
      return metadata && typeof metadata === 'object' && !!metadata.freeShipping;
    }
  } catch (e) {
    return false;
  }
  return false;
};

// Generate random sold count for demo
const getRandomSold = (productId) => {
  const hash = productId.toString().split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  return Math.abs(hash) % 10000;
};

// Generate random rating for demo
const getRandomRating = (productId) => {
  const hash = productId.toString().split('').reduce((a, b) => {
    a = ((a << 3) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  return (3.5 + (Math.abs(hash) % 15) / 10).toFixed(1);
};

const Products = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(''); // สำหรับ URL parameter
  const [selectedCategories, setSelectedCategories] = useState([]); // Array for multiple category selection
  const [activeCategoryId, setActiveCategoryId] = useState(null); // หมวดหมู่ที่เลือกเพื่อแสดง subcategories (เลือกได้แค่อันเดียว)
  const [selectedSubcategories, setSelectedSubcategories] = useState([]); // Array for selected subcategories
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState([0, 200000]);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(20);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [sortBy, setSortBy] = useState('name-asc');
  const [selectedProducts, setSelectedProducts] = useState(new Set()); // Selected product IDs
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [servicesFilters, setServicesFilters] = useState({
    freeShipping: false,
    installment: false,
    withDiscount: false,
    guaranteedCheap: false
  });

  // Handle category checkbox toggle - เมื่อเลือกหมวดหมู่ใหม่ จะแสดง subcategories เฉพาะหมวดหมู่นั้น
  const handleCategoryToggle = (categoryId) => {
    setSelectedCategories(prev => {
      const isCurrentlySelected = prev.includes(categoryId);
      const newCategories = isCurrentlySelected
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId];

      setCurrentPage(1);

      // ถ้ายกเลิกหมวดหมู่ที่กำลัง active อยู่ ให้ลบ subcategories และ clear active
      if (isCurrentlySelected && activeCategoryId === categoryId) {
        const subcategories = getSubcategories(categoryId);
        setSelectedSubcategories(prev =>
          prev.filter(subcat => !subcategories.includes(subcat))
        );
        setActiveCategoryId(null);
      } else if (!isCurrentlySelected) {
        // เมื่อเลือกหมวดหมู่ใหม่ ให้ตั้งเป็น active (แสดง subcategories เฉพาะหมวดหมู่นี้)
        // และลบ subcategories ของหมวดหมู่อื่นๆ ออกทั้งหมด
        setActiveCategoryId(categoryId);
        // ล้าง subcategories ทั้งหมดก่อน แล้วจะให้เลือกใหม่
        setSelectedSubcategories([]);
      }

      // เลื่อนขึ้นบนสุดของหน้าเว็บเมื่อเลือกหมวดหมู่
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });

      return newCategories;
    });
  };


  // Get subcategories for a category from actual data
  const getSubcategories = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.subcategories || [];
  };

  // Handle subcategory checkbox toggle - เลือกได้หลาย subcategories
  const handleSubcategoryToggle = (subcategory) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSelectedSubcategories(prev => {
      const isCurrentlySelected = prev.includes(subcategory);
      const newSubcategories = isCurrentlySelected
        ? prev.filter(s => s !== subcategory)
        : [...prev, subcategory];
      setCurrentPage(1);
      return newSubcategories;
    });
  };

  // Handle product selection
  const handleProductToggle = (productId) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  // Select all products on current page
  const handleSelectAll = () => {
    if (selectedProducts.size === currentProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(currentProducts.map(p => p.id)));
    }
  };

  // Delete selected products
  const handleDeleteSelected = async () => {
    if (selectedProducts.size === 0) {
      toast.warning('กรุณาเลือกสินค้าที่ต้องการลบ');
      return;
    }

    if (!window.confirm(`คุณแน่ใจหรือไม่ที่จะลบสินค้า ${selectedProducts.size} รายการ?`)) {
      return;
    }

    try {
      const token = authStorage.getToken();
      const deletePromises = Array.from(selectedProducts).map(productId =>
        axios.delete(`/api/product/${productId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );

      await Promise.all(deletePromises);
      toast.success(`ลบสินค้า ${selectedProducts.size} รายการสำเร็จ`);
      setSelectedProducts(new Set());
      await loadProducts();
    } catch (error) {
      console.error('Error deleting products:', error);
      toast.error('เกิดข้อผิดพลาดในการลบสินค้า');
    }
  };

  // Check if user is admin or seller
  const isAdminOrSeller = user && (user.role === 'admin' || user.role === 'seller');

  // Check if product has free shipping


  // Get product subcategories - use backend parsed field first, fallback to parsing description
  const getProductSubcategories = useCallback((product) => {
    // Use productSubcategories from backend if available
    if (product.productSubcategories && Array.isArray(product.productSubcategories)) {
      return product.productSubcategories;
    }

    // Fallback: parse from description if backend didn't parse it
    if (!product.description) return [];
    try {
      const metadata = JSON.parse(product.description);
      if (metadata && typeof metadata === 'object' && metadata.productSubcategories && Array.isArray(metadata.productSubcategories)) {
        return metadata.productSubcategories;
      }
    } catch (e) {
      // Not JSON format
    }
    return [];
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/products/50');
      console.log('📦 Products loaded:', response.data.products?.length, 'items');
      if (response.data.products?.[0]) {
        const firstProduct = response.data.products[0];
        console.log('First product debug:', {
          id: firstProduct.id,
          title: firstProduct.title,
          description: firstProduct.description,
          isJSON: firstProduct.description?.startsWith('{'),
          hasFreeShipping: hasFreeShipping(firstProduct)
        });
        
        // Debug all free shipping products
        const freeShippingCount = response.data.products.filter(p => hasFreeShipping(p)).length;
        console.log('Total products with free shipping:', freeShippingCount);
      }
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('❌ Error loading products:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดสินค้า');
    } finally {
      setLoading(false);
    }
  }, []);

  // ฟังก์ชันค้นหาจาก query parameter
  const handleSearchWithQuery = useCallback(async (query) => {
    try {
      setLoading(true);
      const filters = { query };
      if (selectedCategory) filters.category = [parseInt(selectedCategory)];
      if (priceRange[0] > 0 || priceRange[1] < 100000) filters.price = priceRange;
      const response = await axios.post('/api/search/filters', filters);
      setProducts(response.data.products || []);
    } catch (error) {
      console.error(error);
      toast.error('เกิดข้อผิดพลาดในการค้นหา');
      await loadProducts(); // Fallback to load all products
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, priceRange, loadProducts]);

  // อ่าน query parameter จาก URL และตั้งค่า search query และ category
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    const categoryParam = params.get('category');

    // ตั้งค่า category จาก query parameter (ไม่ต้องเรียก loadProducts ซ้ำ)
    if (categoryParam && selectedCategory !== String(categoryParam)) {
      const categoryId = parseInt(categoryParam);
      setSelectedCategory(String(categoryParam));

      // ตั้งค่า selectedCategories และ activeCategoryId
      if (!selectedCategories.includes(categoryId)) {
        setSelectedCategories([categoryId]);
      }
      setActiveCategoryId(categoryId);

      // เลื่อนขึ้นบนสุดของหน้าเว็บเมื่อกดหมวดหมู่เข้ามา
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });

      // เลื่อนไปที่หมวดหมู่ที่เลือกใน sidebar หลังจาก render (optional)
      setTimeout(() => {
        const categoryElement = document.getElementById(`category-${categoryId}`);
        if (categoryElement) {
          // เลื่อน sidebar ไปที่หมวดหมู่ที่เลือก (เฉพาะใน sidebar container)
          const sidebarContainer = categoryElement.closest('.space-y-1');
          if (sidebarContainer) {
            categoryElement.scrollIntoView({
              behavior: 'smooth',
              block: 'nearest',
              inline: 'nearest'
            });
          }
        }
      }, 300);
    } else if (!categoryParam && selectedCategory !== '') {
      setSelectedCategory('');
      setActiveCategoryId(null);
    }

    if (q) {
      setSearchQuery(q);
      // ทำการค้นหาอัตโนมัติเมื่อมี query parameter
      handleSearchWithQuery(q);
    } else if (!q && products.length === 0) {
      // โหลดสินค้าเฉพาะเมื่อยังไม่มีข้อมูล และไม่มี query
      loadProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, loadProducts]);

  useEffect(() => {
    loadCategories();
    // โหลดสินค้าครั้งแรกเมื่อ component mount
    const params = new URLSearchParams(location.search);
    if (!params.get('q') && !params.get('category')) {
      loadProducts();
    }
  }, [loadProducts]);



  const loadCategories = async () => {
    try {
      const response = await axios.get('/api/category');
      setCategories(response.data.categories || []);
    } catch (error) { console.error(error); }
  };

  const filteredProducts = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase();
    const selectedId = selectedCategory ? parseInt(selectedCategory) : null;

    const result = products.filter((p) => {
      // Category filter - support both single and multiple selection
      let matchesCategory = true;
      if (selectedCategories.length > 0) {
        matchesCategory = selectedCategories.includes(p.categoryId);
      } else if (selectedId) {
        matchesCategory = p.categoryId === selectedId;
      }

      // Search filter
      const matchesSearch =
        !searchQuery ||
        p.title.toLowerCase().includes(lowerQuery) ||
        p.description?.toLowerCase().includes(lowerQuery);

      // Price filter
      const currentPrice = getCurrentPrice(p);
      const matchesPrice = currentPrice >= priceRange[0] && currentPrice <= priceRange[1];

      // Services filters
      let matchesServices = true;
      if (servicesFilters.withDiscount) {
        matchesServices = matchesServices && isProductOnDiscount(p);
      }
      if (servicesFilters.freeShipping) {
        matchesServices = matchesServices && hasFreeShipping(p);
      }
      // Note: installment, guaranteedCheap would need product/store data

      // Subcategory filter - check if product has selected subcategories
      let matchesSubcategory = true;
      if (selectedSubcategories.length > 0) {
        const productSubcats = getProductSubcategories(p);
        // กรองสินค้าที่มี subcategory ที่เลือก
        matchesSubcategory = selectedSubcategories.some(subcat =>
          productSubcats.includes(subcat)
        );
      }

      return matchesCategory && matchesSearch && matchesPrice && matchesServices && matchesSubcategory;
    });

    // Sort by name (alphabetical - ก-ฮ, A-Z)
    if (sortBy === 'name-asc') {
      return [...result].sort((a, b) => {
        const titleA = (a.title || '').trim();
        const titleB = (b.title || '').trim();
        // Use localeCompare with 'th' locale for proper Thai sorting (ก-ฮ)
        // and 'en' for English (A-Z)
        return titleA.localeCompare(titleB, 'th', {
          sensitivity: 'base',
          numeric: true,
          caseFirst: 'upper'
        });
      });
    }

    // Sort by name (reverse - ฮ-ก, Z-A)
    if (sortBy === 'name-desc') {
      return [...result].sort((a, b) => {
        const titleA = (a.title || '').trim();
        const titleB = (b.title || '').trim();
        return titleB.localeCompare(titleA, 'th', {
          sensitivity: 'base',
          numeric: true,
          caseFirst: 'upper'
        });
      });
    }

    // Sort by price
    if (sortBy === 'price-low') return [...result].sort((a, b) => getCurrentPrice(a) - getCurrentPrice(b));
    if (sortBy === 'price-high') return [...result].sort((a, b) => getCurrentPrice(b) - getCurrentPrice(a));

    // Default: return as is
    return result;
  }, [products, selectedCategory, selectedCategories, selectedSubcategories, searchQuery, priceRange, sortBy, servicesFilters, getProductSubcategories]);

  const { currentProducts, totalPages } = useMemo(() => {
    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    return {
      currentProducts: filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct),
      totalPages: Math.ceil(filteredProducts.length / productsPerPage),
    };
  }, [filteredProducts, currentPage, productsPerPage]);

  // Debug info can be re-enabled if needed
  // console.log('🔍 Debug Info:', { products: products.length, filtered: filteredProducts.length });

  // แสดงเฉพาะหมวดหมู่ที่เลือก ถ้าไม่มีให้แสดงทั้งหมด
  const sortedCategories = useMemo(() => {
    if (!categories.length) return [];

    // ถ้ามีหมวดหมู่ที่เลือก ให้แสดงเฉพาะหมวดหมู่ที่เลือกเท่านั้น
    if (selectedCategories.length > 0) {
      return categories.filter(c => selectedCategories.includes(c.id));
    }

    // ถ้าไม่มีหมวดหมู่ที่เลือก ให้แสดงทั้งหมด
    return [...categories];
  }, [categories, selectedCategories]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedCategories, selectedSubcategories, searchQuery, priceRange, productsPerPage, servicesFilters, activeCategoryId]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = async () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      setLoading(true);
      const filters = {};
      if (searchQuery) filters.query = searchQuery;
      if (selectedCategory) filters.category = [parseInt(selectedCategory)];
      if (priceRange[0] > 0 || priceRange[1] < 100000) filters.price = priceRange;
      if (Object.keys(filters).length > 0) {
        const response = await axios.post('/api/search/filters', filters);
        setProducts(response.data.products || []);
      } else {
        await loadProducts();
      }
    } catch (error) {
      console.error(error);
      toast.error('เกิดข้อผิดพลาดในการค้นหา');
    } finally {
      setLoading(false);
    }
  };

  // Show full page loading only on initial load
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    if (!loading && isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [loading, isInitialLoad]);



  if (loading && isInitialLoad) {
    return <PageLoading text="กำลังโหลดสินค้า..." />;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] relative">
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center">
            <div className="relative mb-4">
              <div className="w-16 h-16 border-4 border-orange-100 rounded-full"></div>
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-[#ee4d2d] rounded-full animate-spin"></div>
            </div>
            <p className="text-[#ee4d2d] font-medium text-lg">กำลังค้นหา...</p>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <div className="max-w-[1200px] mx-auto px-4 pt-24 sm:pt-28 pb-8">

        {/* Shopee-style Sort Bar */}
        <div className="bg-[#ededed] rounded-sm p-3 mb-4 flex flex-wrap items-center gap-2 sm:gap-4 shadow-md">
          <span className="text-gray-600 text-sm hidden sm:block">เรียงตาม</span>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('default')}
              className={`px-4 py-1.5 text-sm rounded-sm transition-all ${sortBy === 'default'
                ? 'bg-[#ee4d2d] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
            >
              ล่าสุด
            </button>
            <button
              onClick={() => setSortBy('popular')}
              className={`px-4 py-1.5 text-sm rounded-sm transition-all ${sortBy === 'popular'
                ? 'bg-[#ee4d2d] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
            >
              ยอดนิยม
            </button>
            <button
              onClick={() => setSortBy('bestseller')}
              className={`px-4 py-1.5 text-sm rounded-sm transition-all ${sortBy === 'bestseller'
                ? 'bg-[#ee4d2d] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
            >
              ขายดี
            </button>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-1.5 bg-white border-none rounded-sm text-gray-700 text-sm cursor-pointer min-w-[180px] focus:outline-none focus:ring-1 focus:ring-[#ee4d2d]"
          >
            <option value="price-low">ราคา: ต่ำ → สูง</option>
            <option value="price-high">ราคา: สูง → ต่ำ</option>
            <option value="name-asc">ชื่อ: ก-ฮ, A-Z</option>
            <option value="name-desc">ชื่อ: ฮ-ก, Z-A</option>
          </select>

          <div className="ml-auto flex items-center gap-2 text-sm text-gray-600">
            <span className="text-[#ee4d2d] font-medium">{currentPage}</span>
            <span>/</span>
            <span>{totalPages || 1}</span>
          </div>
        </div>

        {/* Admin/Seller Actions */}
        {isAdminOrSeller && (
          <div className="bg-white rounded-sm shadow-sm p-3 mb-4 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setShowCreateForm(true);
                }}
                className="px-4 py-2 bg-[#ee4d2d] text-white rounded-sm hover:bg-[#d73211] transition-colors text-sm font-medium flex items-center gap-2"
              >
                <i className="fas fa-plus"></i>
                <span>เพิ่มสินค้า</span>
              </button>
              {selectedProducts.size > 0 && (
                <>
                  <span className="text-sm text-gray-600">
                    เลือกแล้ว: <span className="text-[#ee4d2d] font-bold">{selectedProducts.size}</span> รายการ
                  </span>
                  <button
                    onClick={handleDeleteSelected}
                    className="px-4 py-2 bg-red-500 text-white rounded-sm hover:bg-red-600 transition-colors text-sm flex items-center gap-2"
                  >
                    <i className="fas fa-trash"></i>
                    <span>ลบที่เลือก</span>
                  </button>
                </>
              )}
            </div>
            <span className="text-sm text-gray-500">{filteredProducts.length} สินค้า</span>
          </div>
        )}

        <div className="flex gap-5">
          {/* Sidebar - Shopee Style */}
          <aside className="hidden lg:block w-[190px] flex-shrink-0">
            <div className="bg-white rounded-sm shadow-sm">
              {/* Categories */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <i className="fas fa-list text-gray-600 text-sm"></i>
                  <h3 className="text-sm font-bold text-gray-800">หมวดหมู่</h3>
                </div>
                <div className="space-y-1">
                  {sortedCategories.map(category => {
                    const isChecked = selectedCategories.includes(category.id);
                    const isActive = activeCategoryId === category.id;
                    const subcategories = getSubcategories(category.id);
                    const hasSubcategories = subcategories.length > 0;

                    return (
                      <div key={category.id} id={`category-${category.id}`}>
                        <div
                          className={`flex items-center gap-2 py-2 cursor-pointer text-sm transition-colors ${isChecked ? 'text-[#ee4d2d] font-medium' : 'text-gray-600 hover:text-[#ee4d2d]'
                            }`}
                          onClick={() => handleCategoryToggle(category.id)}
                        >
                          {isChecked && <i className="fas fa-angle-right text-[#ee4d2d] text-xs"></i>}
                          <span>{category.name}</span>
                        </div>

                        {hasSubcategories && isActive && (
                          <div className="ml-3 pl-3 border-l border-gray-200 space-y-0.5">
                            {subcategories.map((subcat, idx) => {
                              const isSubcatSelected = selectedSubcategories.includes(subcat);
                              return (
                                <div
                                  key={idx}
                                  onClick={() => handleSubcategoryToggle(subcat)}
                                  className={`py-1.5 px-2 cursor-pointer text-sm rounded transition-colors ${isSubcatSelected
                                    ? 'text-[#ee4d2d] bg-orange-50'
                                    : 'text-gray-500 hover:text-[#ee4d2d]'
                                    }`}
                                >
                                  {subcat}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Search Filter */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <i className="fas fa-filter text-gray-600 text-sm"></i>
                  <h3 className="text-sm font-bold text-gray-800">ค้นหา</h3>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch();
                      }
                    }}
                    placeholder="ค้นหาสินค้า..."
                    className="w-full px-3 py-2 pr-10 rounded-sm border border-gray-300 focus:border-[#ee4d2d] focus:outline-none text-sm"
                  />
                  <button
                    onClick={handleSearch}
                    className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-[#ee4d2d]"
                  >
                    <i className="fas fa-search"></i>
                  </button>
                </div>
              </div>

              {/* Services Filter */}
              <div className="p-4">
                <h3 className="text-sm font-bold text-gray-800 mb-3">บริการ & โปรโมชั่น</h3>
                <div className="space-y-2.5">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={servicesFilters.freeShipping}
                      onChange={(e) => {
                        setServicesFilters(prev => ({ ...prev, freeShipping: e.target.checked }));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="w-4 h-4 text-[#ee4d2d] border-gray-300 rounded focus:ring-[#ee4d2d] focus:ring-1"
                    />
                    <div className="flex items-center gap-1.5">
                      <i className="fas fa-truck text-orange-500 text-xs"></i>
                      <span className="text-sm text-gray-600 group-hover:text-[#ee4d2d]">ส่งฟรี</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={servicesFilters.withDiscount}
                      onChange={(e) => {
                        setServicesFilters(prev => ({ ...prev, withDiscount: e.target.checked }));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="w-4 h-4 text-[#ee4d2d] border-gray-300 rounded focus:ring-[#ee4d2d] focus:ring-1"
                    />
                    <span className="text-sm text-gray-600 group-hover:text-[#ee4d2d]">มีส่วนลดด้วยน๊ะจ๊ะ</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={servicesFilters.installment}
                      onChange={(e) => {
                        setServicesFilters(prev => ({ ...prev, installment: e.target.checked }));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="w-4 h-4 text-[#ee4d2d] border-gray-300 rounded focus:ring-[#ee4d2d] focus:ring-1"
                    />
                    <span className="text-sm text-gray-600 group-hover:text-[#ee4d2d]">ผ่อน 0%</span>
                  </label>
                </div>
              </div>

              {/* Clear All Button */}
              <div className="p-4 pt-0">
                <button
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    setSearchQuery('');
                    setSelectedCategory('');
                    setSelectedCategories([]);
                    setSelectedSubcategories([]);
                    setActiveCategoryId(null);
                    setPriceRange([0, 200000]);
                    setServicesFilters({
                      freeShipping: false,
                      installment: false,
                      withDiscount: false,
                      guaranteedCheap: false
                    });
                    loadProducts();
                  }}
                  className="w-full py-2 bg-[#ee4d2d] text-white rounded-sm hover:bg-[#d73211] text-sm font-medium transition-colors"
                >
                  ล้างทั้งหมด
                </button>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <main className="flex-1 min-w-0">
            {/* Select All for Admin/Seller */}
            {isAdminOrSeller && currentProducts.length > 0 && (
              <div className="mb-3 p-2 bg-white rounded-sm shadow-sm flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedProducts.size === currentProducts.length && currentProducts.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-[#ee4d2d] border-gray-300 rounded focus:ring-[#ee4d2d]"
                  />
                  <span className="text-sm text-gray-700">
                    เลือกทั้งหมด ({currentProducts.length})
                  </span>
                </label>
              </div>
            )}

            {/* Products Grid - Shopee Style */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"> 
                {currentProducts.map((p) => {
                  const isSelected = selectedProducts.has(p.id);
                  const soldCount = getRandomSold(p.id);
                  const rating = getRandomRating(p.id);

                  return (
                    <div
                      key={p.id}
                      // 2. เพิ่ม shadow-md ที่นี่ และเพิ่ม border-gray-100 เพื่อความคมชัด
                      className={`bg-white rounded-sm overflow-hidden cursor-pointer relative group transition-all duration-200 shadow-md border border-gray-100 hover:-translate-y-0.5 hover:shadow-lg ${
                        isSelected ? 'ring-2 ring-[#ee4d2d]' : ''
                      }`}
                      onClick={(e) => {
                        if (e.target.type === 'checkbox' || e.target.closest('input[type="checkbox"]')) {
                          return;
                        }
                        navigate(`/product/${p.id}`);
                      }}
                    >
                      {/* ... (ส่วนเนื้อหาข้างในเหมือนเดิม) ... */}
                      
                      {/* Checkbox for Admin/Seller */}
                      {isAdminOrSeller && (
                        <div
                          className="absolute top-2 left-2 z-20"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleProductToggle(p.id)}
                            className="w-4 h-4 text-[#ee4d2d] border-gray-300 rounded cursor-pointer shadow-sm"
                          />
                        </div>
                      )}

                      {/* Product Image */}
                      <div className="relative aspect-square overflow-hidden bg-white border-b border-gray-100">
                        <img
                          src={p.images?.[0]?.url || 'https://via.placeholder.com/400x400?text=No+Image'}
                          alt={p.title}
                          className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/400x400?text=No+Image'; }}
                        />

                        {/* Discount Badge */}
                        {isProductOnDiscount(p) && (
                          <div className="absolute top-0 right-0 bg-[#ee4d2d] text-white text-xs font-bold px-1.5 py-0.5 shadow-sm">
                            <span className="text-[10px]">-</span>{getDiscountPercentage(p)}%
                          </div>
                        )}

                        {/* Free Shipping Label */}
                        {hasFreeShipping(p) && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-cyan-400 to-teal-400 text-white text-[10px] py-0.5 px-1.5 flex items-center gap-1 shadow-sm">
                            <i className="fas fa-truck text-[8px]"></i>
                            <span>ส่งฟรี</span>
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="p-3">
                        {/* Title */}
                        <h3 className="text-sm text-gray-800 line-clamp-2 min-h-[40px] mb-2 leading-snug">
                          {p.title}
                        </h3>

                        {/* Price Section */}
                        <div className="flex items-end gap-1 mb-1">
                          <span className="text-[#ee4d2d] font-medium text-base sm:text-lg">
                            ฿{getCurrentPrice(p).toLocaleString()}
                          </span>
                          {isProductOnDiscount(p) && (
                            <span className="text-gray-400 text-[10px] sm:text-xs line-through">
                              ฿{p.price.toLocaleString()}
                            </span>
                          )}
                        </div>

                        {/* Bottom Info - Rating & Sold */}
                        <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-500">
                          <div className="flex items-center gap-0.5">
                            <i className="fas fa-star text-yellow-400 text-[8px]"></i>
                            <span>{rating}</span>
                          </div>
                          <span>ขายแล้ว {soldCount > 1000 ? `${(soldCount / 1000).toFixed(1)}พัน` : soldCount}</span>
                        </div>

                        {/* Store Name */}
                        {p.store && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/store/${p.store.id}`);
                            }}
                            className="mt-1.5 text-[10px] sm:text-xs text-gray-400 hover:text-[#ee4d2d] flex items-center gap-1 truncate w-full"
                          >
                            <i className="fas fa-store text-[8px]"></i>
                            <span className="truncate">{p.store.name}</span>
                          </button>
                        )}
                      </div>

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
                    </div>
                  );
                })}
              </div>

            {/* Pagination - Shopee Style */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-1.5">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`w-9 h-9 flex items-center justify-center rounded-sm bg-white border transition-colors ${currentPage === 1
                    ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                    : 'border-gray-300 text-gray-600 hover:bg-[#ee4d2d] hover:text-white hover:border-[#ee4d2d]'
                    }`}
                >
                  <i className="fas fa-chevron-left text-xs"></i>
                </button>

                {Array.from({ length: totalPages }, (_, i) => {
                  // Show limited page numbers
                  const pageNum = i + 1;
                  if (totalPages <= 7) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-9 h-9 flex items-center justify-center rounded-sm text-sm transition-colors ${currentPage === pageNum
                          ? 'bg-[#ee4d2d] text-white'
                          : 'bg-white border border-gray-300 text-gray-600 hover:bg-[#ee4d2d] hover:text-white hover:border-[#ee4d2d]'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }

                  // Show first, last, current and nearby pages
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-9 h-9 flex items-center justify-center rounded-sm text-sm transition-colors ${currentPage === pageNum
                          ? 'bg-[#ee4d2d] text-white'
                          : 'bg-white border border-gray-300 text-gray-600 hover:bg-[#ee4d2d] hover:text-white hover:border-[#ee4d2d]'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }

                  // Show ellipsis
                  if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                    return <span key={pageNum} className="px-2 text-gray-400">...</span>;
                  }

                  return null;
                })}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`w-9 h-9 flex items-center justify-center rounded-sm bg-white border transition-colors ${currentPage === totalPages
                    ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                    : 'border-gray-300 text-gray-600 hover:bg-[#ee4d2d] hover:text-white hover:border-[#ee4d2d]'
                    }`}
                >
                  <i className="fas fa-chevron-right text-xs"></i>
                </button>
              </div>
            )}

            {/* No products */}
            {filteredProducts.length === 0 && (
              <div className="text-center py-16 bg-white rounded-sm">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-search text-gray-300 text-4xl"></i>
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">ไม่พบสินค้า</h3>
                <p className="text-gray-500 text-sm mb-4">ลองค้นหาด้วยคำอื่น หรือปรับตัวกรอง</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('');
                    setSelectedCategories([]);
                    setSelectedSubcategories([]);
                    setPriceRange([0, 200000]);
                    loadProducts();
                  }}
                  className="px-6 py-2 bg-[#ee4d2d] text-white rounded-sm hover:bg-[#d73211] text-sm transition-colors"
                >
                  ล้างตัวกรอง
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Product Form Modal */}
      {showCreateForm && (
        <ProductForm
          editingProduct={editingProduct}
          onClose={() => {
            setShowCreateForm(false);
            setEditingProduct(null);
          }}
          onSuccess={async () => {
            try {
              toast.success(editingProduct ? 'อัพเดตสินค้าสำเร็จ!' : 'เพิ่มสินค้าใหม่สำเร็จ!');
              setShowCreateForm(false);
              setEditingProduct(null);
              await loadProducts();
            } catch (error) {
              console.error('Error in onSuccess:', error);
            }
          }}
          onRefresh={loadProducts}
          createEndpoint={user?.role === 'seller' ? '/api/seller/product' : '/api/product'}
          updateEndpointBase={user?.role === 'seller' ? '/api/seller/product' : '/api/product'}
        />
      )}

      {/* Login Popup */}
      <LoginPopup
        isOpen={showLoginPopup}
        onClose={() => setShowLoginPopup(false)}
        productTitle=""
      />
    </div>
  );
};

export default Products;
