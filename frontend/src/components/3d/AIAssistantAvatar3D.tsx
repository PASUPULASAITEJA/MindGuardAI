import React from "react";
import AICompanionVisual, { AICompanionVisualProps } from "./AICompanionVisual";

export const AIAssistantAvatar3D: React.FC<AICompanionVisualProps> = (props) => {
  return <AICompanionVisual {...props} />;
};

export { AICompanionVisual } from "./AICompanionVisual";
export default AIAssistantAvatar3D;
