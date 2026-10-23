import React from "react";
import BreathingSphere, { BreathingSphereProps } from "./BreathingSphere";

interface LegacyBreathingSphere3DProps {
  phase?: string;
  isActive?: boolean;
  className?: string;
}

export const BreathingSphere3D: React.FC<LegacyBreathingSphere3DProps & BreathingSphereProps> = (props) => {
  return <BreathingSphere {...props} />;
};

export { BreathingSphere } from "./BreathingSphere";
export default BreathingSphere3D;
