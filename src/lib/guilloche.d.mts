export const SYMMETRY: number;
export interface Harmonic { k: number; a: number; p: number; t: number; w: number }
export interface RingSpec { base: number; amp: number; alpha: number; i: number }
export interface Field { H: Harmonic[]; rings: RingSpec[] }
export function makeField(o?: { seed?: number; rings?: number; inner?: number; outer?: number }): Field;
export function ringRadius(field: Field, g: RingSpec, th: number, ph?: number): number;
export function fieldSvg(o: { field: Field; R?: number; step?: number; every?: number }): string;
export function fieldExtent(field: Field): number;
