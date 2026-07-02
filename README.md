# F2LTrainer 🧩

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Svelte](https://img.shields.io/badge/Svelte-5.0-orange.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)

**A speedcubing training application for F2L, featuring 3D cube rendering, algorithmic training, and smart cube integration.**

> 🚀 **[Live Demo](https://f2l-trainer.top/)**

[![F2L Trainer Video](static/images/thumbnail_play_button.png)](https://youtu.be/UpPg1hKqkLE?si=bS5Jkk4sHrCdi1DR)

## ✨ Features

- **🎯 Specialized Training:** Dedicated modes for learning and drilling F2L algorithms.
- **🛜 Bluetooth Smart Cube Support:** Connect your smart cube directly to get real-time feedback and automatic timing.
- **🧊 3D Visualization:** Interactive 3D cube player powered by `cubing.js`.
- **📊 Statistics:** Track your progress with detailed charts and session history.
- **📱 Responsive Design:** Fully optimized for desktop and mobile devices.

## 🛠️ Built With

- **Framework:** [Svelte 5](https://svelte.dev) & SvelteKit
- **Styling:** [TailwindCSS v4](https://tailwindcss.com) & [Flowbite Svelte](https://flowbite-svelte.com/)
- **Cube Logic:** [cubing.js](https://js.cubing.net/cubing/)
- **Smartcube Integration:** [smartcube-web-bluetooth](https://github.com/poliva/smartcube-web-bluetooth)

This F2L Trainer was inspired by JPerms [OLL Trainer](https://jperm.net/algs/oll) and Romans [OLL Trainer](https://bestsiteever.ru/oll/) / [PLL Trainer](https://bestsiteever.ru/pll/).

---

## 📸 Screenshots

### Selection & Training

|                                 Case Selection                                 |                                   Classic Training                                    |
| :----------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------: |
| <img src="static/images/readme/SelectView.png" alt="Select View" width="100%"> | <img src="static/images/readme/TrainClassic.png" alt="Classic Training" width="100%"> |

|                                  Drill Mode                                   |                                  Smart Cube Integration                                   |
| :---------------------------------------------------------------------------: | :---------------------------------------------------------------------------------------: |
| <img src="static/images/readme/TrainDrill.png" alt="Drill Mode" width="100%"> | <img src="static/images/readme/TrainClassicSmart.png" alt="Smart Cube Mode" width="100%"> |

### Statistics

|                                  Session Insights                                   |                                Case Analysis                                 |
| :---------------------------------------------------------------------------------: | :--------------------------------------------------------------------------: |
| <img src="static/images/readme/SesstionStats.png" alt="Session Stats" width="100%"> | <img src="static/images/readme/CaseStats.png" alt="Case Stats" width="100%"> |

---

## ❓ Further Help

Feel free to create an [issue](https://github.com/Dave2ooo/F2LTrainer/issues) if you need any help, have ideas for improvement or find any bugs. I'm happy to help.

## 🤝 Contributing

Feel free to tackle any [Issue](https://github.com/Dave2ooo/F2LTrainer/issues) on your own. If you want to change something that is not covered in an issue, please create an issue first, to make sure the pull request will be approved.

---

## 💻 Development Setup

Follow these steps to set up the project on a **fresh Windows 11** machine.

### 1️⃣ Install Node.js (LTS)

Download and install the **LTS version** of Node.js from:  
👉 [https://nodejs.org/en/download](https://nodejs.org/en/download)

During installation, make sure to **check**

> ✅ _“Automatically install necessary tools”_

This ensures required build tools are set up.

> 💡 **Note:** A restart of your PC may be required after installation for Node.js to work correctly in the terminal.

---

### 2️⃣ Verify Installation

Open a terminal (PowerShell or Windows Terminal) and check:

```bash
node -v
pnpm -v
```

You should see versions printed for both commands.  
If pnpm is not installed, install it with:

```bash
npm install -g pnpm
```

---

### 3️⃣ Clone the Repository

Clone this project from GitHub and navigate into it:

```bash
git clone https://github.com/Dave2ooo/F2LTrainer.git
cd F2LTrainer
```

---

### 4️⃣ Install Dependencies

Run:

```bash
pnpm install
```

This installs all required packages defined in the project’s `pnpm-lock.yaml`.

---

### 5️⃣ Start the Development Server

Launch the app locally with:

```bash
pnpm run dev
```

Then open your browser at the address shown in the terminal (usually [http://localhost:5173](http://localhost:5173)).

---

### ✅ Done!

You’re ready to start developing!  
The project uses **SvelteKit**, **TypeScript**, **TailwindCSS**, and **Flowbite** — all preconfigured.
