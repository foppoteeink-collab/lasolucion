import React from 'react';
import { Sparkles, Star, PenTool, Flame, Zap } from 'lucide-react';

export const DoodleSparkle = ({ className, fill }: { className?: string, fill?: string }) => <Sparkles className={className} fill={fill || "none"} />;
export const DoodleStar = ({ className, fill }: { className?: string, fill?: string }) => <Star className={className} fill={fill || "none"} />;
export const DoodlePencil = ({ className, fill }: { className?: string, fill?: string }) => <PenTool className={className} fill={fill || "none"} />;
export const DoodleFire = ({ className, fill }: { className?: string, fill?: string }) => <Flame className={className} fill={fill || "none"} />;
export const DoodleLightning = ({ className, fill }: { className?: string, fill?: string }) => <Zap className={className} fill={fill || "none"} />;

export const DoodleSwirl = () => null;
export const DoodleArrow = () => null;
export const DoodleSkull = () => null;
export const DoodleCrown = () => null;
export const DoodlePlanet = () => null;
export const DoodleScribble = () => null;
export const PsychedelicEye = () => null;
export const PsychedelicSwirl = () => null;
export const PsychedelicCreature = () => null;
export const PsychedelicDoodleBannerCanvas = () => null;
