export function formatPower(watts) {
  if (typeof watts !== "number" || isNaN(watts)) return "0 W";

  if (watts >= 1000) {
    return `${(watts / 1000).toFixed(1)} kW`;
  }
  return `${Math.round(watts)} W`;
}

export function formatVoltage(volts) {
  if (typeof volts !== "number" || isNaN(volts)) return "0 V";
  return `${volts.toFixed(1)} V`;
}

export function formatCurrent(amps) {
  if (typeof amps !== "number" || isNaN(amps)) return "0 A";
  return `${amps.toFixed(1)} A`;
}

export function formatBattery(percentage) {
  if (typeof percentage !== "number" || isNaN(percentage)) return "0%";
  return `${Math.round(percentage)}%`;
}

export function formatEnergy(wh) {
  if (typeof wh !== "number" || isNaN(wh)) return "0 Wh";

  if (wh >= 1000) {
    return `${(wh / 1000).toFixed(1)} kWh`;
  }
  return `${Math.round(wh)} Wh`;
}

export function getStatusColor(status) {
  const statusLower = status?.toLowerCase() || "";

  switch (statusLower) {
    case "charging":
    case "charge":
      return "text-green-600 bg-green-100";
    case "discharging":
    case "discharge":
      return "text-blue-600 bg-blue-100";
    case "idle":
    case "standby":
      return "text-gray-600 bg-gray-100";
    case "error":
    case "fault":
      return "text-red-600 bg-red-100";
    default:
      return "text-gray-600 bg-gray-100";
  }
}

export function getBatteryColor(percentage) {
  if (percentage >= 80) return "text-green-600";
  if (percentage >= 50) return "text-yellow-600";
  if (percentage >= 20) return "text-orange-600";
  return "text-red-600";
}
