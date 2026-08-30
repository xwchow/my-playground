# 📱 Studio Builder

A mobile-first creation studio for the Playground. Build, test, and deploy self-contained web applications directly from your mobile device.

---

## 🎯 Features

- **Conversational Studio**: Generate complete web applications with Gemini 3.7 Flash.
- **Interactive Live Preview**: Test touch controls, layouts, and sound effects in a sandboxed frame before you publish.
- **Atomic Deployment**: Commit new applications directly to GitHub with one tap.
- **Design System Enforcement**: Applications automatically follow the Editorial Paper Design System.

---

## ⚙️ Environment Variables

Configure these environment variables in your Vercel project dashboard:

| Variable Name | Description | Source |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Google AI Studio API key | [Google AI Studio](https://aistudio.google.com/) |
| `GITHUB_TOKEN` | GitHub Personal Access Token with repository write permissions | [GitHub Token Settings](https://github.com/settings/tokens/new) |
| `GITHUB_REPO` | Target GitHub repository (for example, `xwchow/my-playground`) | GitHub |

---

## 🚀 How to Deploy to Vercel

1. Open [vercel.com](https://vercel.com) in your web browser.
2. Select **Add New...** and choose **Project**.
3. Select your `my-playground` repository from the list.
4. Set the **Framework Preset** to **Other**.
5. Add the required environment variables.
6. Click **Deploy**.

---

## 📱 How to Use on Mobile

1. Open `https://<your-vercel-domain>/builder/` on your mobile phone.
2. Add the page to your home screen for quick access.
3. Enter your application requirements in the input field.
4. Select **Generate App** to build the application.
5. Tap **Preview** to test the application interactively.
6. Select **Push to GitHub** to publish your application.

---

## 🧪 Verification

Run the test suite with Node.js:

```bash
node builder/test.js
```
