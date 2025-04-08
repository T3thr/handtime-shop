"use client";
import React from "react";
import { Facebook, Instagram, Twitter } from "lucide-react";

// Export content for Search.jsx
export const footerContent = [
  {
    name: "ร้านค้า",
    content: "สินค้าทั้งหมด, สินค้าใหม่, สินค้าขายดี, สินค้าลดราคา",
  },
  {
    name: "เกี่ยวกับเรา",
    content: "เรื่องราวของเรา, ช่างฝีมือ, ความยั่งยืน, บล็อก",
  },
  {
    name: "บริการลูกค้า",
    content: "ติดต่อเรา, คำถามที่พบบ่อย, นโยบายการจัดส่ง, นโยบายการคืนสินค้า",
  },
];

export default function Footer() {
  return (
    <footer id="footer-about" className="bg-background-secondary border-t border-border-primary">
      <div className="container mx-auto max-w-7xl px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-4">HandTime Shop</h3>
            <p className="text-text-secondary text-sm mb-4" data-search-term="handtime shop">
              นำเสนอผลิตภัณฑ์หัตถกรรมที่ไม่เหมือนใคร ทำด้วยความรักและประเพณีจากจังหวัดอุตรดิตถ์
            </p>
            <div className="flex space-x-4">
              {[
                { name: "Facebook", icon: <Facebook size={24} /> },
                { name: "Instagram", icon: <Instagram size={24} /> },
                { name: "Twitter", icon: <Twitter size={24} /> },
              ].map((social) => (
                <a
                  key={social.name}
                  href="#"
                  className="text-text-muted hover:text-primary transition-colors duration-200"
                  aria-label={social.name}
                >
                  <span className="sr-only">{social.name}</span>
                  <div className="w-8 h-8 rounded-full bg-surface-card flex items-center justify-center">
                    {social.icon}
                  </div>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-4" data-search-term="ร้านค้า">
              ร้านค้า
            </h3>
            <ul className="space-y-2">
              {["สินค้าทั้งหมด", "สินค้าใหม่", "สินค้าขายดี", "สินค้าลดราคา"].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-text-secondary hover:text-primary transition-colors duration-200 text-sm"
                    data-search-term={item}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-4" data-search-term="เกี่ยวกับเรา">
              เกี่ยวกับเรา
            </h3>
            <ul className="space-y-2">
              {["เรื่องราวของเรา", "ช่างฝีมือ", "ความยั่งยืน", "บล็อก"].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-text-secondary hover:text-primary transition-colors duration-200 text-sm"
                    data-search-term={item}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-4" data-search-term="บริการลูกค้า">
              บริการลูกค้า
            </h3>
            <ul className="space-y-2">
              {["ติดต่อเรา", "คำถามที่พบบ่อย", "นโยบายการจัดส่ง", "นโยบายการคืนสินค้า"].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-text-secondary hover:text-primary transition-colors duration-200 text-sm"
                    data-search-term={item}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border-primary mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-text-muted text-sm mb-4 md:mb-0">
            © {new Date().getFullYear()} HandTime Shop. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <a href="#" className="text-text-muted hover:text-primary text-sm" data-search-term="นโยบายความเป็นส่วนตัว">
              นโยบายความเป็นส่วนตัว
            </a>
            <a href="#" className="text-text-muted hover:text-primary text-sm" data-search-term="ข้อกำหนดในการให้บริการ">
              ข้อกำหนดในการให้บริการ
            </a>
            <a href="#" className="text-text-muted hover:text-primary text-sm" data-search-term="คุกกี้">
              คุกกี้
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}