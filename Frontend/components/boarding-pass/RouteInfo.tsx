import React from 'react';
import { Plane } from 'lucide-react';

interface RouteInfoProps {
  departureCity: string;
  departureAirport: string;
  departureTime: string;
  arrivalCity: string;
  arrivalAirport: string;
  arrivalTime: string;
  duration: string;
}

const RouteInfo: React.FC<RouteInfoProps> = ({
  departureCity,
  departureAirport,
  departureTime,
  arrivalCity,
  arrivalAirport,
  arrivalTime,
  duration
}) => {
  return (
    <div className="mt-8 flex items-center justify-between">
      <div className="text-left">
        <div className="text-5xl sm:text-6xl font-black leading-none tracking-tight">{departureCity}</div>
        <div className="text-xs mt-2 opacity-90 font-medium">{departureAirport}</div>
        <div className="text-sm mt-1 font-bold">{departureTime}</div>
      </div>
      <div className="flex flex-col items-center px-4">
        <Plane className="w-8 h-8 rotate-90 opacity-80" />
        <div className="text-xs mt-2 opacity-75">{duration}</div>
      </div>
      <div className="text-right">
        <div className="text-5xl sm:text-6xl font-black leading-none tracking-tight">{arrivalCity}</div>
        <div className="text-xs mt-2 opacity-90 font-medium">{arrivalAirport}</div>
        <div className="text-sm mt-1 font-bold">{arrivalTime}</div>
      </div>
    </div>
  );
};

export default RouteInfo;
