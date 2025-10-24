import { getStatusColor } from "../utils/formatters";

export default function StatusCard({
  title,
  value,
  unit,
  status,
  icon,
  color = "blue",
}) {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200",
    green: "bg-green-50 border-green-200",
    yellow: "bg-yellow-50 border-yellow-200",
    red: "bg-red-50 border-red-200",
    gray: "bg-gray-50 border-gray-200",
  };

  const iconColorClasses = {
    blue: "text-blue-600",
    green: "text-green-600",
    yellow: "text-yellow-600",
    red: "text-red-600",
    gray: "text-gray-600",
  };

  return (
    <div className={`p-6 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-700 mb-1">{title}</h3>
          <div className="flex items-baseline">
            <span className="text-2xl font-bold text-gray-900">
              {value || "--"}
            </span>
            {unit && <span className="ml-1 text-sm text-gray-500">{unit}</span>}
          </div>
        </div>

        {icon && (
          <div className={`flex-shrink-0 ${iconColorClasses[color]}`}>
            {icon}
          </div>
        )}
      </div>

      {status && (
        <div className="mt-3">
          <span
            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
              status
            )}`}
          >
            {status}
          </span>
        </div>
      )}
    </div>
  );
}
