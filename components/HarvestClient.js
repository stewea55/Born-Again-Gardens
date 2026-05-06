"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabaseClient } from "../lib/supabase/browser";
import { readCart, writeCart } from "../lib/cart/client-cart";

function hasDisplayValue(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim() !== "";
  return true;
}

function formatCurrency(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return value;
  return `$${amount.toFixed(2)}`;
}

function formatMarketPrice(value, unit) {
  if (!hasDisplayValue(value)) return null;
  const formattedValue = formatCurrency(value);
  if (!hasDisplayValue(unit)) return formattedValue;
  return `${formattedValue} /${unit}`;
}

export default function HarvestClient({ plants }) {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [basketItems, setBasketItems] = useState([]);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [modalQuantity, setModalQuantity] = useState(0);
  const [initialModalQuantity, setInitialModalQuantity] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSavingModal, setIsSavingModal] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadBasket() {
      const supabase = getBrowserSupabaseClient();
      const items = await readCart("harvest", supabase);
      if (active) setBasketItems(Array.isArray(items) ? items : []);
    }

    loadBasket();

    return () => {
      active = false;
    };
  }, []);

  const sortedPlants = useMemo(
    () =>
      [...(plants || [])].sort((a, b) =>
        String(a?.name || "").localeCompare(String(b?.name || ""), undefined, { sensitivity: "base" })
      ),
    [plants]
  );

  const activePlants = useMemo(
    () => sortedPlants.filter((plant) => plant.statys !== false),
    [sortedPlants]
  );

  const categoryOptions = useMemo(() => {
    const unique = new Set();
    activePlants.forEach((plant) => {
      if (hasDisplayValue(plant?.category)) unique.add(plant.category);
    });
    return [...unique].sort((a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: "base" }));
  }, [activePlants]);

  const categoryFilteredPlants = useMemo(() => {
    if (selectedCategories.length === 0) return activePlants;
    return activePlants.filter((plant) => selectedCategories.includes(plant.category));
  }, [selectedCategories, activePlants]);

  const visiblePlants = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return categoryFilteredPlants;

    return categoryFilteredPlants.filter((plant) => {
      const name = String(plant?.name || "").toLowerCase();
      const scientificName = String(plant?.scientific_name || "").toLowerCase();
      return name.includes(normalizedSearch) || scientificName.includes(normalizedSearch);
    });
  }, [categoryFilteredPlants, searchTerm]);

  const searchSuggestions = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const uniqueNames = new Set();

    categoryFilteredPlants.forEach((plant) => {
      const name = String(plant?.name || "");
      if (!name) return;
      if (!normalizedSearch || name.toLowerCase().includes(normalizedSearch)) {
        uniqueNames.add(name);
      }
    });

    return [...uniqueNames]
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
      .slice(0, 20);
  }, [categoryFilteredPlants, searchTerm]);

  const getBasketQuantity = (plantId) => {
    const existing = basketItems.find((item) => Number(item?.item_id) === Number(plantId));
    return Number(existing?.quantity || 0);
  };

  const upsertBasketQuantity = async (plant, quantity) => {
    const supabase = getBrowserSupabaseClient();
    const nextQuantity = Math.max(0, Number(quantity || 0));
    const nextItems = [...basketItems];
    const existingIndex = nextItems.findIndex((item) => Number(item?.item_id) === Number(plant.id));

    if (nextQuantity === 0) {
      if (existingIndex >= 0) nextItems.splice(existingIndex, 1);
      await writeCart("harvest", nextItems, supabase);
      setBasketItems(nextItems);
      setStatus(`${plant.name || `Plant ${plant.id}`} removed from basket.`);
      return;
    }

    if (existingIndex >= 0) {
      nextItems[existingIndex] = {
        ...nextItems[existingIndex],
        quantity: nextQuantity,
        unit_price: Number(plant.market_price || 0),
        metadata: {
          ...(nextItems[existingIndex].metadata || {}),
          plant_name: plant.name || `Plant ${plant.id}`,
          unit: plant.unit || "item"
        }
      };
    } else {
      nextItems.push({
        item_type: "plant",
        item_id: plant.id,
        quantity: nextQuantity,
        size: null,
        unit_price: Number(plant.market_price || 0),
        metadata: {
          plant_name: plant.name || `Plant ${plant.id}`,
          unit: plant.unit || "item"
        }
      });
    }

    await writeCart("harvest", nextItems, supabase);
    setBasketItems(nextItems);
    setStatus(`${plant.name || `Plant ${plant.id}`} quantity updated to ${nextQuantity}.`);
  };

  const handleOpenPlantModal = (plant) => {
    const currentQuantity = getBasketQuantity(plant.id);
    setSelectedPlant(plant);
    setModalQuantity(currentQuantity);
    setInitialModalQuantity(currentQuantity);
  };

  const handleConfirmPlantModal = async () => {
    if (!selectedPlant || isSavingModal) return;
    if (Number(modalQuantity || 0) === Number(initialModalQuantity || 0)) {
      setSelectedPlant(null);
      return;
    }
    setIsSavingModal(true);
    try {
      await upsertBasketQuantity(selectedPlant, modalQuantity);
      setSelectedPlant(null);
    } finally {
      setIsSavingModal(false);
    }
  };

  const handleBackdropClick = () => {
    if (isSavingModal) return;
    if (Number(modalQuantity || 0) === 0) {
      setSelectedPlant(null);
    }
  };

  const toggleCategory = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((value) => value !== category) : [...prev, category]
    );
  };

  const modalRows = useMemo(() => {
    if (!selectedPlant) return [];

    const rows = [
      { label: "Scientific name", value: selectedPlant.scientific_name },
      { label: "Description", value: selectedPlant.description },
      { label: "Companion plants", value: selectedPlant.companion_plants },
      { label: "Market price", value: formatMarketPrice(selectedPlant.market_price, selectedPlant.unit) }
    ];

    return rows.filter((row) => hasDisplayValue(row.value));
  }, [selectedPlant]);

  return (
    <>
      <section className="section">
        <h2 className="subheading">Plant catalog</h2>
        <div className="harvest-controls">
          <div className="button-row" style={{ justifyContent: "flex-start", marginTop: 0 }}>
            <button type="button" className="button" onClick={() => router.push("/basket")}>
              View my basket
            </button>
          </div>
          <input
            id="harvest-plant-search"
            type="text"
            list="harvest-plant-suggestions"
            placeholder="Search by plant name"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <datalist id="harvest-plant-suggestions">
            {searchSuggestions.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
          {status && <p className="paragraph">{status}</p>}

          <div className="harvest-category-row">
            {categoryOptions.map((category) => {
              const active = selectedCategories.includes(category);
              return (
                <button
                  key={category}
                  type="button"
                  className={active ? "button" : "menu-button"}
                  onClick={() => toggleCategory(category)}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        <div className="harvest-catalog-grid">
          {visiblePlants.map((plant) => (
            <button
              key={plant.id}
              type="button"
              className="harvest-plant-card"
              onClick={() => handleOpenPlantModal(plant)}
            >
              <div className="harvest-plant-image">
                {hasDisplayValue(plant.image_url) ? (
                  <img src={plant.image_url} alt={plant.name || `Plant ${plant.id}`} />
                ) : (
                  <span className="paragraph">No image yet</span>
                )}
              </div>
              <span className="harvest-plant-name">{plant.name || `Plant ${plant.id}`}</span>
            </button>
          ))}
        </div>
      </section>

      {selectedPlant && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={handleBackdropClick}>
          <div className="modal harvest-modal" onClick={(event) => event.stopPropagation()}>
            <h3 className="subheading">{selectedPlant.name || `Plant ${selectedPlant.id}`}</h3>
            {hasDisplayValue(selectedPlant.image_url) && (
              <div className="harvest-modal-image">
                <img src={selectedPlant.image_url} alt={selectedPlant.name || `Plant ${selectedPlant.id}`} />
              </div>
            )}
            <div className="harvest-modal-rows">
              {modalRows.map((row) => (
                <div key={row.label}>
                  <p className="paragraph harvest-label">{row.label}</p>
                  <p className="paragraph">{row.value}</p>
                </div>
              ))}
            </div>
            <div className="modal-actions harvest-modal-actions">
              {modalQuantity > 0 ? (
                <>
                  <div className="harvest-quantity-toggle harvest-quantity-toggle-wide">
                    <button
                      type="button"
                      className="menu-button"
                      onClick={() => setModalQuantity((value) => Math.max(0, Number(value || 0) - 1))}
                      disabled={isSavingModal}
                    >
                      -
                    </button>
                    <p className="paragraph">Quantity: {modalQuantity}</p>
                    <button
                      type="button"
                      className="menu-button"
                      onClick={() => setModalQuantity((value) => Number(value || 0) + 1)}
                      disabled={isSavingModal}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    className="button harvest-add-button"
                    onClick={() => void handleConfirmPlantModal()}
                    disabled={isSavingModal}
                  >
                    Confirm
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="button harvest-add-button"
                  onClick={() => setModalQuantity(1)}
                  disabled={isSavingModal}
                >
                  Add to basket
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {visiblePlants.length === 0 && (
        <section className="section">
          <p className="paragraph">No plants match your current filters.</p>
        </section>
      )}
    </>
  );
}
