type ParameterOptions = {
	defaultValue?: number;
	min?: number;
	max?: number;
	/** Step size for incrementing/decrementing with hotkey. */
	step?: number;
	/** Step size for adjusting with slider. */
	sliderStep?: number;
};

/**
 * Class that holds the config for a numberic parameter.
 * It does NOT hold the parameter value itself, but provides helper functions for manipulating the value.
 */
export default class Parameter {
	defaultValue: number;
	min: number;
	max: number;
	step: number;
	sliderStep: number;

	constructor(options: ParameterOptions) {
		this.defaultValue = options.defaultValue ?? 0;
		this.step = options.step ?? 1;
		this.min = options.min ?? -Infinity;
		this.max = options.max ?? Infinity;
		this.sliderStep = options.sliderStep ?? 0.01;
	}

	toNearestStep(v: number): number {
		return Math.round(v / this.step) * this.step;
	}
	increment(v: number): number {
		return this.toNearestStep(Math.min(v + this.step, this.max));
	}
	decrement(v: number): number {
		return this.toNearestStep(Math.max(v - this.step, this.min));
	}

	/** HTML input attributes for slider. */
	get sliderAttributes() {
		return {
			min: this.min,
			max: this.max,
			step: this.sliderStep
		};
	}
}
