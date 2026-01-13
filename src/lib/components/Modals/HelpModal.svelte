<script lang="ts">
	import Modal from '../Modal.svelte';
	import { Accordion, AccordionItem } from '../Accordion';
	import { A } from 'flowbite-svelte';
	import FeedbackModal from './FeedbackModal.svelte';
	import {
		Rocket,
		Dumbbell,
		Bluetooth,
		BarChart3,
		Lightbulb,
		BookOpen,
		Zap,
		Timer,
		Settings2,
		Eye,
		Shuffle
	} from '@lucide/svelte';

	let open = $state(false);
	let feedbackModal: FeedbackModal;

	export function openModal() {
		open = true;
	}

	export function closeModal() {
		open = false;
	}
</script>

<Modal bind:open title="Help" size="lg" outsideclose={true} autoclose={false}>
	<div class="max-h-[70vh] space-y-2 overflow-y-auto pr-2">
		<Accordion>
			<!-- Getting Started -->
			<AccordionItem>
				{#snippet header()}
					<div class="flex items-center gap-2">
						<Rocket class="size-4 text-primary-600 dark:text-primary-400" />
						<span>Getting Started</span>
					</div>
				{/snippet}
				<div class="text-md space-y-3 px-3 py-1 text-gray-700 dark:text-gray-300">
					<p>
						<strong>F2L Trainer</strong> helps you master the First Two Layers (F2L) step of the CFOP
						method for solving a Rubik's Cube. Track your learning progress, discover algorithms, and
						practice them until they become muscle memory.
					</p>
					<div class="space-y-2">
						<p class="font-medium">Quick Start:</p>
						<ol class="list-inside list-decimal space-y-1 pl-2">
							<li>
								<strong>Select cases</strong> — Choose which F2L cases you want to practice from the
								case selection screen
							</li>
							<li>
								<strong>Pick a training mode</strong> — Standard Practice, Standard Practice Smart, or
								Speed Drill (see Training Modes below)
							</li>
							<li>
								<strong>Start training</strong> — Follow the scramble, solve the case, and track your
								progress
							</li>
						</ol>
					</div>
					<p class="text-gray-600 dark:text-gray-400">
						Use the interactive 3D cube to visualize cases — you can rotate it by dragging!
					</p>
				</div>
			</AccordionItem>

			<!-- Training Modes -->
			<AccordionItem>
				{#snippet header()}
					<div class="flex items-center gap-2">
						<Dumbbell class="size-4 text-primary-600 dark:text-primary-400" />
						<span>Training Modes</span>
					</div>
				{/snippet}
				<div class="text-md space-y-4 px-3 py-1 text-gray-700 dark:text-gray-300">
					<!-- Standard Practice -->
					<div class="rounded-lg border border-gray-200 px-3 py-1 dark:border-gray-600">
						<div class="mb-2 flex items-center gap-2">
							<BookOpen class="size-4 text-blue-500" />
							<span class="font-semibold">Standard Practice</span>
						</div>
						<p>
							Practice F2L cases at your own pace using a physical cube. Optionally use the timer to
							track your solve times, or practice without pressure.
						</p>
						<ul class="mt-2 list-inside list-disc space-y-1 pl-2 text-gray-600 dark:text-gray-400">
							<li>Press and hold <kbd class="kbd">Space</kbd> to prime the timer (optional)</li>
							<li>Release to start timing, press again to stop</li>
							<li>Use arrow buttons or click the cube to navigate cases</li>
							<li>Timer can be disabled in session settings for pressure-free practice</li>
						</ul>
					</div>

					<!-- Standard Practice Smart -->
					<div class="rounded-lg border border-gray-200 px-3 py-1 dark:border-gray-600">
						<div class="mb-2 flex items-center gap-2">
							<Zap class="size-4 text-purple-500" />
							<span class="font-semibold">Standard Practice Smart</span>
							<Bluetooth class="size-3.5 text-blue-500" />
						</div>
						<p>
							Similar to Standard Practice, but with smart cube integration. The cube automatically
							tracks your moves and displays them in real-time — no manual scrambling needed!
						</p>
						<ul class="mt-2 list-inside list-disc space-y-1 pl-2 text-gray-600 dark:text-gray-400">
							<li>Requires a connected smart cube</li>
							<li>Real-time move tracking on the 3D cube</li>
							<li>No need to scramble manually — just follow along</li>
							<li>Great for learning new algorithms with guided feedback</li>
						</ul>
					</div>

					<!-- Speed Drill -->
					<div class="rounded-lg border border-gray-200 px-3 py-1 dark:border-gray-600">
						<div class="mb-2 flex items-center gap-2">
							<Timer class="size-4 text-green-500" />
							<span class="font-semibold">Speed Drill</span>
							<Bluetooth class="size-3.5 text-blue-500" />
						</div>
						<p>
							Challenge yourself to improve recognition and execution times for algorithms you
							already know. This mode is focused on speed, not learning.
						</p>
						<ul class="mt-2 list-inside list-disc space-y-1 pl-2 text-gray-600 dark:text-gray-400">
							<li>Requires a connected smart cube</li>
							<li>
								<strong>Recognition time:</strong> From case shown until your first non-U move
							</li>
							<li>
								<strong>Execution time:</strong> From first non-U move until solved
							</li>
							<li>Helps identify whether recognition or execution needs more work</li>
						</ul>
					</div>
				</div>
			</AccordionItem>

			<!-- Advanced Features & Settings -->
			<AccordionItem>
				{#snippet header()}
					<div class="flex items-center gap-2">
						<Settings2 class="size-4 text-primary-600 dark:text-primary-400" />
						<span>Advanced Settings</span>
					</div>
				{/snippet}
				<div class="text-md space-y-4 px-3 py-1 text-gray-700 dark:text-gray-300">
					<!-- Smart Frequency -->
					<div class="space-y-2">
						<div class="flex items-center gap-2 font-medium">
							<Shuffle class="size-4 text-orange-500" />
							<span>Smart Frequency</span>
						</div>
						<p>
							Optimize your practice by letting the trainer choose cases based on your performance:
						</p>
						<ul class="list-inside list-disc space-y-1 pl-2 text-gray-600 dark:text-gray-400">
							<li>
								<strong>Prioritize Unsolved:</strong> Shows cases you haven't solved yet more frequently.
							</li>
							<li>
								<strong>Prioritize Slow:</strong> Focuses on cases where your execution time is above
								your average.
							</li>
						</ul>
					</div>

					<!-- Algorithm Hints -->
					<div class="space-y-2">
						<div class="flex items-center gap-2 font-medium">
							<Lightbulb class="size-4 text-yellow-500" />
							<span>Algorithm Hints</span>
						</div>
						<p>Choose how algorithms are displayed during training:</p>
						<ul class="list-inside list-disc space-y-1 pl-2 text-gray-600 dark:text-gray-400">
							<li><strong>Reveal step-by-step:</strong> Show the next move one at a time.</li>
							<li><strong>Reveal all at once:</strong> Show the full algorithm after a click.</li>
							<li>
								<strong>Show all time:</strong> Always display the algorithm (great for learning).
							</li>
						</ul>
					</div>

					<!-- Visualization -->
					<div class="space-y-2">
						<div class="flex items-center gap-2 font-medium">
							<Eye class="size-4 text-green-500" />
							<span>Visualization</span>
						</div>
						<ul class="list-inside list-disc space-y-1 pl-2 text-gray-600 dark:text-gray-400">
							<li>
								<strong>Add Random AUF:</strong> Adds a random U-layer rotation to the end of scrambles
								to test your top-layer recognition.
							</li>
							<li>
								<strong>Back View / Floating Stickers:</strong> Help you visualize pieces on the back
								of the cube without rotating it.
							</li>
						</ul>
					</div>
				</div>
			</AccordionItem>

			<!-- Smart Cube Setup -->
			<AccordionItem>
				{#snippet header()}
					<div class="flex items-center gap-2">
						<Bluetooth class="size-4 text-primary-600 dark:text-primary-400" />
						<span>Smart Cube Setup</span>
					</div>
				{/snippet}
				<div class="text-md space-y-3 px-3 py-1 text-gray-700 dark:text-gray-300">
					<p>
						Smart cubes connect via Bluetooth and enable automatic move tracking for enhanced
						training modes.
					</p>

					<div class="space-y-2">
						<p class="font-medium">How to Connect:</p>
						<ol class="list-inside list-decimal space-y-1 pl-2">
							<li>Click the Bluetooth button in the navigation bar</li>
							<li>Select "Connect New Cube" or choose a saved cube</li>
							<li>Follow your browser's Bluetooth pairing prompt</li>
							<li>
								Hold the cube with <strong>Green front, White up</strong> during training
							</li>
						</ol>
					</div>

					<div class="space-y-2">
						<p class="font-medium">Tested & Supported Cubes:</p>
						<ul class="list-inside list-disc space-y-1 pl-2">
							<li>QiYi Smart Cube</li>
							<li>MoYu WeiLong V10 AI</li>
							<li>GAN356 i3</li>
							<li>GAN356 i carry S</li>
							<li>GAN 12 ui</li>
						</ul>
						<p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
							Have a different smart cube? Let us know if it works using the
							<button
								type="button"
								class="font-semibold text-blue-600 underline hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
								onclick={() => feedbackModal.openModal()}
							>
								Feedback form
							</button>!
						</p>
					</div>

					<div
						class="text-md mt-3 space-y-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-blue-800 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
					>
						<div>
							<p class="font-semibold text-blue-900 dark:text-blue-200">Browser Support:</p>
							<p class="text-sm">
								Web Bluetooth works best in Chrome and Edge. Safari on iOS does not support Web
								Bluetooth — download
								<A
									href="https://apps.apple.com/app/bluefy-web-bluetooth-browser/id1492822055"
									target="_blank"
									class="underline hover:text-blue-700 dark:hover:text-blue-100"
									>Bluefy - Web Bluetooth Browser</A
								> from the App Store and open F2L Trainer inside it.
							</p>
						</div>
					</div>
				</div>
			</AccordionItem>

			<!-- Sessions & Statistics -->
			<AccordionItem>
				{#snippet header()}
					<div class="flex items-center gap-2">
						<BarChart3 class="size-4 text-primary-600 dark:text-primary-400" />
						<span>Sessions & Statistics</span>
					</div>
				{/snippet}
				<div class="text-md space-y-3 px-3 py-1 text-gray-700 dark:text-gray-300">
					<div class="space-y-2">
						<p class="font-medium">Sessions:</p>
						<p>
							Sessions help you organize your practice. Each session can have different cases
							selected, different settings, and tracks its own statistics.
						</p>
						<ul class="list-inside list-disc space-y-1 pl-2 text-gray-600 dark:text-gray-400">
							<li>Create multiple sessions for different practice focuses</li>
							<li>Switch between sessions from the dropdown in training view</li>
							<li>Configure hint settings, timer display, and more per session</li>
						</ul>
					</div>

					<div class="space-y-2">
						<p class="font-medium">Understanding Your Statistics:</p>
						<ul class="list-inside list-disc space-y-1 pl-2 text-gray-600 dark:text-gray-400">
							<li>
								<strong>Best Time:</strong> Your fastest solve for a case.
							</li>
							<li>
								<strong>Ao5:</strong> Average of 5 (best and worst times removed from last 5 solves).
							</li>
							<li>
								<strong>Recognition Time:</strong> Time spent identifying the case (Speed Drill mode).
							</li>
							<li>
								<strong>Execution Time:</strong> Time spent performing the algorithm.
							</li>
							<li>
								<strong>Total Solves:</strong> Number of times you've practiced a case.
							</li>
						</ul>
					</div>

					<p class="text-gray-600 dark:text-gray-400">
						View detailed statistics by clicking on the case card or the session stats in the right
						panel.
					</p>
				</div>
			</AccordionItem>

			<!-- Tips & Troubleshooting -->
			<AccordionItem>
				{#snippet header()}
					<div class="flex items-center gap-2">
						<Lightbulb class="size-4 text-primary-600 dark:text-primary-400" />
						<span>Tips & Troubleshooting</span>
					</div>
				{/snippet}
				<div class="text-md space-y-3 px-3 py-1 text-gray-700 dark:text-gray-300">
					<div class="space-y-2">
						<p class="font-medium">Practice Tips:</p>
						<ul class="list-inside list-disc space-y-1 pl-2 text-gray-600 dark:text-gray-400">
							<li>
								<strong>Start Small:</strong> Pick 3-5 cases and master them before adding more. This
								prevents feeling overwhelmed.
							</li>
							<li>
								<strong>Use the Recap:</strong> Enable "Recap Mode" in session settings to cycle through
								your selected cases and reinforce memory.
							</li>
							<li>
								<strong>Drill Execution:</strong> Once you know an algorithm, use Speed Drill to build
								muscle memory and reduce execution time.
							</li>
							<li>
								<strong>Side Neutrality:</strong> Practice both left and right side insertions for the
								same case when applicable.
							</li>
							<li>
								<strong>Track Progress:</strong> Manually change case states (Unlearned → Learning →
								Learned) to keep motivated.
							</li>
						</ul>
					</div>

					<div class="space-y-2">
						<p class="font-medium">Common Issues:</p>
						<ul class="list-inside list-disc space-y-1 pl-2">
							<li>
								<strong>Moves not tracking properly:</strong> Ensure you are using a supported cube.
								Calibrate your cube in its native app if moves are missing.
							</li>
							<li>
								<strong>High Latency:</strong> Close other Bluetooth devices or browser tabs that might
								be interfering with the connection.
							</li>
						</ul>
					</div>

					<div
						class="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 dark:border-blue-800 dark:bg-blue-900/30"
					>
						<p class="text-blue-800 dark:text-blue-200">
							<strong>Need more help?</strong> Use the
							<button
								type="button"
								class="font-semibold text-blue-600 underline hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
								onclick={() => feedbackModal.openModal()}
							>
								Feedback form
							</button>
							to report issues or suggest improvements. You can also visit our
							<A
								href="https://github.com/Dave2ooo/F2LTrainer-Svelte"
								target="_blank"
								rel="noopener noreferrer"
								class="text-blue-600 hover:underline dark:text-blue-400">GitHub page</A
							>.
						</p>
					</div>
				</div>
			</AccordionItem>
		</Accordion>
	</div>
</Modal>

<FeedbackModal bind:this={feedbackModal} />

<style>
	.kbd {
		display: inline-block;
		padding: 0.1rem 0.4rem;
		font-size: 0.75rem;
		font-family: monospace;
		background-color: #e5e7eb;
		border: 1px solid #d1d5db;
		border-radius: 0.25rem;
	}
	:global(.dark) .kbd {
		background-color: #374151;
		border-color: #4b5563;
	}
</style>
