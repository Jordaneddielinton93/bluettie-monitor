import React from "react";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import { useSectionOrder } from "../hooks/useSectionOrder";
import DraggableSection from "./DraggableSection";
import { 
  Cog6ToothIcon,
  ArrowPathIcon 
} from "@heroicons/react/24/outline";

export default function DragDropContainer({ children, sectionComponents }) {
  const {
    sections,
    loading,
    error,
    reorderSections,
    toggleSectionVisibility,
    resetSectionOrder,
  } = useSectionOrder();

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex !== destinationIndex) {
      reorderSections(sourceIndex, destinationIndex);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-cyan-400 font-mono text-sm">
          LOADING SECTIONS...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-800/50 border border-red-400/30 rounded-lg p-4 text-center">
        <div className="text-red-400 text-xl mb-2">ERROR</div>
        <div className="text-gray-300 font-mono text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Order Controls */}
      <div className="bg-slate-800/50 border border-cyan-400/20 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-cyan-300 font-mono">
            DASHBOARD LAYOUT
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={resetSectionOrder}
              className="flex items-center space-x-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-slate-300 hover:text-white transition-colors duration-200"
              title="Reset to default order"
            >
              <ArrowPathIcon className="h-4 w-4" />
              <span className="text-sm font-mono">RESET</span>
            </button>
            <div className="flex items-center space-x-2 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-300">
              <Cog6ToothIcon className="h-4 w-4" />
              <span className="text-sm font-mono">DRAG TO REORDER</span>
            </div>
          </div>
        </div>
        
        <div className="text-sm text-gray-400 font-mono">
          Hover over sections to see drag handles and visibility controls
        </div>
      </div>

      {/* Draggable Sections */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="sections">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`space-y-6 ${
                snapshot.isDraggingOver ? "bg-cyan-400/5 rounded-lg" : ""
              }`}
            >
              {sections
                .filter((section) => section.visible)
                .map((section, index) => (
                  <DraggableSection
                    key={section.name}
                    section={section}
                    index={index}
                    onToggleVisibility={toggleSectionVisibility}
                  >
                    {sectionComponents[section.name] || (
                      <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4">
                        <div className="text-slate-400 font-mono">
                          Section "{section.name}" not found
                        </div>
                      </div>
                    )}
                  </DraggableSection>
                ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
