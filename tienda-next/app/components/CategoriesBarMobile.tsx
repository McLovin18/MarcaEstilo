"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CATEGORIES_STRUCTURE } from "./categories";
import { useUser } from "../context/UserContext";
import { useTracking } from "../lib/useAnalytics";

const CategoriesBarMobile = () => {
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [openSubcategory, setOpenSubcategory] = useState<string | null>(null);
  const { trackCategoryClick } = useTracking();

  const { isAdmin, user } = useUser();
  if (typeof user === 'undefined') return null;
  const basePath = isAdmin ? "/admin/products-by-category" : "/products-by-category";
  return (
    <div className="lg:hidden sticky top-16 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 px-4 py-3">
      <div className="flex flex-col gap-2">
        {Object.values(CATEGORIES_STRUCTURE).map(category => (
          <div key={category.id} className="relative">
            <button
              className="w-full flex items-center justify-between px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-sm font-medium"
              type="button"
              onClick={() => setOpenCategory(openCategory === category.id ? null : category.id)}
            >
              <span className="flex items-center gap-2">
                <span className="material-icons-round text-base">{category.icon}</span>
                <span>{category.name}</span>
              </span>
              <span className="material-icons-round text-base">
                {openCategory === category.id ? "expand_less" : "expand_more"}
              </span>
            </button>
            {category.isDropdown && openCategory === category.id && (
              <div className="ml-4 space-y-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2 my-1">
                {Object.values(category.subcategories).map(subcat => (
                  <div key={subcat.id} className="relative">
                    <button
                      className="w-full flex items-center justify-between px-3 py-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-xs"
                      type="button"
                      onClick={() => setOpenSubcategory(openSubcategory === subcat.id ? null : subcat.id)}
                    >
                      <span className="flex items-center gap-2">
                        <span className="material-icons-round text-base">{subcat.icon}</span>
                        <span>{subcat.name}</span>
                      </span>
                      {subcat.subsubcategories && typeof subcat.subsubcategories === 'object' && (
                        <span className="material-icons-round text-base">
                          {openSubcategory === subcat.id ? "expand_less" : "expand_more"}
                        </span>
                      )}
                    </button>
                    {subcat.subsubcategories && typeof subcat.subsubcategories === 'object' && openSubcategory === subcat.id && (
                      <div className="ml-4 space-y-1">
                        {Object.values(subcat.subsubcategories).map((subsubcat: any) => (
                          <Link
                            key={subsubcat.id}
                            href={`${basePath}?category=${category.id}&subcategory=${subcat.id}&subsubcategory=${subsubcat.id}`}
                            onClick={() => trackCategoryClick().catch(console.error)}
                            className="block px-3 py-2 rounded text-xs hover:bg-slate-200 dark:hover:bg-slate-700"
                          >
                            {subsubcat.name}
                          </Link>
                        ))}
                      </div>
                    )}
                    {(!subcat.subsubcategories || typeof subcat.subsubcategories !== 'object') && (
                      <Link
                        href={`${basePath}?category=${category.id}&subcategory=${subcat.id}`}
                        onClick={() => trackCategoryClick().catch(console.error)}
                        className="block px-3 py-2 rounded text-xs hover:bg-slate-200 dark:hover:bg-slate-700"
                      >
                        {subcat.name}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
            {!category.isDropdown && openCategory === category.id && (
              <Link
                href={`${basePath}?category=${category.id}`}
                onClick={() => trackCategoryClick().catch(console.error)}
                className="block px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-sm font-medium"
              >
                {category.name}
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoriesBarMobile;
