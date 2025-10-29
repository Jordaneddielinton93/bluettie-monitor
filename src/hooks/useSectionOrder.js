import { useState, useEffect, useCallback } from "react";

const API_BASE = "http://192.168.1.145:8083";

export function useSectionOrder() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSectionOrder = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/sections/order`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to fetch section order");
      }
      const data = await response.json();
      setSections(data.sections);
      setError(null);
      return data.sections;
    } catch (err) {
      console.error("Error fetching section order:", err);
      setError(err.message);
      setSections([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSectionOrder = useCallback(async (newSections) => {
    try {
      const response = await fetch(`${API_BASE}/api/sections/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sections: newSections }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to update section order");
      }

      const data = await response.json();
      setSections(newSections);
      setError(null);
      return data;
    } catch (err) {
      console.error("Error updating section order:", err);
      setError(err.message);
      throw err;
    }
  }, []);

  const resetSectionOrder = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/sections/reset`, {
        method: "POST",
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to reset section order");
      }

      // Refresh the section order
      await fetchSectionOrder();
      setError(null);
    } catch (err) {
      console.error("Error resetting section order:", err);
      setError(err.message);
      throw err;
    }
  }, [fetchSectionOrder]);

  const toggleSectionVisibility = useCallback(
    (sectionName) => {
      const updatedSections = sections.map((section) =>
        section.name === sectionName
          ? { ...section, visible: !section.visible }
          : section
      );
      updateSectionOrder(updatedSections);
    },
    [sections, updateSectionOrder]
  );

  const reorderSections = useCallback(
    (startIndex, endIndex) => {
      const newSections = Array.from(sections);
      const [removed] = newSections.splice(startIndex, 1);
      newSections.splice(endIndex, 0, removed);

      // Update the order numbers
      const updatedSections = newSections.map((section, index) => ({
        ...section,
        order: index + 1,
      }));

      updateSectionOrder(updatedSections);
    },
    [sections, updateSectionOrder]
  );

  useEffect(() => {
    fetchSectionOrder();
  }, [fetchSectionOrder]);

  return {
    sections,
    loading,
    error,
    fetchSectionOrder,
    updateSectionOrder,
    resetSectionOrder,
    toggleSectionVisibility,
    reorderSections,
  };
}
