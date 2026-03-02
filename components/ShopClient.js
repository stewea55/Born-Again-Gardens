"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { getBrowserSupabaseClient } from "../lib/supabase/browser";
import { readCart, writeCart } from "../lib/cart/client-cart";

function getProductName(product) {
  return product.name || product.product_name || `Product ${product.id}`;
}

export default function ShopClient({ products }) {
  const [status, setStatus] = useState("");
  const [selectedSizes, setSelectedSizes] = useState({});

  const normalizedProducts = useMemo(
    () =>
      (products || []).map((product) => ({
        ...product,
        productName: getProductName(product),
        price: Number(product.price || 0)
      })),
    [products]
  );

  const addToCart = async (product) => {
    const supabase = getBrowserSupabaseClient();
    const current = await readCart("shop", supabase);
    const size = selectedSizes[product.id] || null;
    const existingIndex = current.findIndex(
      (item) => item.item_id === product.id && (item.size || null) === size
    );
    if (existingIndex >= 0) {
      current[existingIndex] = {
        ...current[existingIndex],
        quantity: Number(current[existingIndex].quantity || 0) + 1
      };
    } else {
      current.push({
        item_type: "shop",
        item_id: product.id,
        quantity: 1,
        size,
        unit_price: product.price,
        metadata: {
          product_name: product.productName
        }
      });
    }
    await writeCart("shop", current, supabase);
    setStatus(`${product.productName} added to cart.`);
  };

  return (
    <>
      <section className="section card">
        <p className="paragraph">
          This is the v1 functional `/shop` backbone page. It is intentionally simple while we build
          your final UI vision.
        </p>
        <div className="button-row" style={{ justifyContent: "flex-start" }}>
          <Link href="/cart" className="button">
            View cart
          </Link>
        </div>
        {status && <p className="paragraph">{status}</p>}
      </section>

      <section className="section">
        <h2 className="subheading">Shop catalog</h2>
        <div className="two-column">
          {normalizedProducts.map((product) => (
            <article key={product.id} className="card">
              <h3 className="subheading" style={{ textAlign: "left" }}>
                {product.productName}
              </h3>
              <p className="paragraph">
                Price: ${Number(product.price || 0).toFixed(2)}
                <br />
                {product.description || product.details || "Product details coming soon."}
              </p>
              <label className="paragraph">
                Size (optional)
                <input
                  type="text"
                  value={selectedSizes[product.id] || ""}
                  onChange={(event) =>
                    setSelectedSizes((prev) => ({ ...prev, [product.id]: event.target.value }))
                  }
                />
              </label>
              <button type="button" className="button" onClick={() => addToCart(product)}>
                Add to cart
              </button>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
