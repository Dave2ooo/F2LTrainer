export interface TwistyPlayerElement extends HTMLElement {
	experimentalAddMove(move: string): void;
	experimentalSetupAlg: string;
	alg: string;
	jumpToStart(): void;
}
