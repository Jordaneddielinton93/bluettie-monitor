import React from "react";
import { Draggable } from "react-beautiful-dnd";
import { 
  Bars3Icon, 
  EyeIcon, 
  EyeSlashIcon,
  XMarkIcon 
} from "@heroicons/react/24/outline";

export default function DraggableSection({ 
  section, 
  index, 
  children, 
  onToggleVisibility,
  onRemove 
}) {
  return (
    <Draggable draggableId={section.name} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`relative group ${
            snapshot.isDragging ? "z-50" : ""
          }`}
        >
          {/* Drag Handle */}
          <div
            {...provided.dragHandleProps}
            className="absolute -left-8 top-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-grab active:cursor-grabbing"
          >
            <div className="bg-slate-700 hover:bg-slate-600 rounded-lg p-2 border border-slate-600">
              <Bars3Icon className="h-4 w-4 text-slate-300" />
            </div>
          </div>

          {/* Section Content */}
          <div className="relative">
            {/* Section Controls */}
            <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="flex space-x-2">
                {/* Visibility Toggle */}
                <button
                  onClick={() => onToggleVisibility(section.name)}
                  className={`p-2 rounded-lg border transition-colors duration-200 ${
                    section.visible
                      ? "bg-green-600/20 border-green-400/30 text-green-400 hover:bg-green-600/30"
                      : "bg-red-600/20 border-red-400/30 text-red-400 hover:bg-red-600/30"
                  }`}
                  title={section.visible ? "Hide section" : "Show section"}
                >
                  {section.visible ? (
                    <EyeIcon className="h-4 w-4" />
                  ) : (
                    <EyeSlashIcon className="h-4 w-4" />
                  )}
                </button>

                {/* Remove Section (if needed) */}
                {onRemove && (
                  <button
                    onClick={() => onRemove(section.name)}
                    className="p-2 rounded-lg border bg-red-600/20 border-red-400/30 text-red-400 hover:bg-red-600/30 transition-colors duration-200"
                    title="Remove section"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Section Content */}
            <div
              className={`transition-all duration-200 ${
                !section.visible ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              {children}
            </div>
          </div>

          {/* Drag Overlay */}
          {snapshot.isDragging && (
            <div className="absolute inset-0 bg-slate-800/50 border-2 border-cyan-400 rounded-xl shadow-2xl">
              <div className="flex items-center justify-center h-full">
                <div className="text-cyan-400 font-mono text-lg">
                  Moving {section.name.replace('_', ' ').toUpperCase()}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}
