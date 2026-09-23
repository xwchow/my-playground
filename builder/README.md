# 📱 Studio Builder

A mobile-first creation studio for the Playground. Build, test, and deploy self-contained web applications directly from your mobile device.

Source: [`index.html`](./index.html) (client), [`api/generate.js`](../api/generate.js) and [`api/commit.js`](../api/commit.js) (serverless functions), [`test.js`](./test.js) (verification suite).

---

## 🎯 Features

- **Conversational Studio**: Generate complete web applications with Gemini — [`handleGenerate()`](./index.html#L568) calls [`/api/generate`](../api/generate.js#L174), which tries `gemini-3.8-flash` then falls back to `gemini-3.7-flash` ([`api/generate.js#L307`](../api/generate.js#L307)).
- **Interactive Live Preview**: Test touch controls, layouts, and sound effects in a sandboxed frame before you publish — [`setPreviewContent()`](./index.html#L435) writes into an iframe restricted to `allow-scripts allow-modals allow-forms` ([`index.html#L271`](./index.html#L271)).
- **Runtime Error Auto-Fix**: Errors trapped inside the preview are fed back to the model with surrounding source context — [`autoFixRuntimeError()`](./index.html#L403).
- **Atomic Deployment**: Commit new applications directly to GitHub with one tap — [`handleCommit()`](./index.html#L653) calls [`/api/commit`](../api/commit.js#L158), which retries up to 3 times when `HEAD` shifts ([`api/commit.js#L202`](../api/commit.js#L202)).
- **Design System Enforcement**: Applications automatically follow the [Editorial Paper Design System](../docs/design-system/DESIGN_SYSTEM.md). [`getRepoContext()`](../api/generate.js#L19) loads `AGENTS.md` and `DESIGN_SYSTEM.md` into the system instruction ([`api/generate.js#L216`](../api/generate.js#L216)).

---

## 🗺️ Code Map

### Client — [`builder/index.html`](./index.html)

| Concern | Symbol | Location |
| :--- | :--- | :--- |
| Passcode header | `getAuthHeaders()` | [`index.html#L382`](./index.html#L382) |
| Passcode modal | `openPasscodeModal()` / `savePasscode()` | [`index.html#L509`](./index.html#L509) |
| Error auto-fix | `autoFixRuntimeError()` | [`index.html#L403`](./index.html#L403) |
| Sandboxed preview | `setPreviewContent()` | [`index.html#L435`](./index.html#L435) |
| Storage polyfill for iframe | `createStorage()` | [`index.html#L447`](./index.html#L447) |
| Tab switching | `switchTab()` | [`index.html#L545`](./index.html#L545) |
| Generation | `handleGenerate()` | [`index.html#L568`](./index.html#L568) |
| Deployment | `handleCommit()` | [`index.html#L653`](./index.html#L653) |
| Chat rendering | `appendChatMessage()` / `formatMarkdown()` | [`index.html#L691`](./index.html#L691) |

### Serverless — [`api/generate.js`](../api/generate.js)

| Concern | Symbol | Location |
| :--- | :--- | :--- |
| Repo context loader | `getRepoContext()` | [`generate.js#L19`](../api/generate.js#L19) |
| Model output parser | `parseModelOutput()` | [`generate.js#L49`](../api/generate.js#L49) |
| Request handler & auth | `handler()` | [`generate.js#L174`](../api/generate.js#L174) |
| Model fallback chain | `candidateModels` | [`generate.js#L307`](../api/generate.js#L307) |

### Serverless — [`api/commit.js`](../api/commit.js)

| Concern | Symbol | Location |
| :--- | :--- | :--- |
| GitHub REST wrapper | `githubApi()` | [`commit.js#L7`](../api/commit.js#L7) |
| Project card markup | `generateProjectCardHtml()` | [`commit.js#L29`](../api/commit.js#L29) |
| Homepage injection | `injectCardIntoIndexHtml()` | [`commit.js#L73`](../api/commit.js#L73) |
| Root README injection | `injectEntryIntoReadme()` | [`commit.js#L100`](../api/commit.js#L100) |
| Path traversal guard | `validateAppDataSecurity()` | [`commit.js#L114`](../api/commit.js#L114) |
| Request handler & auth | `handler()` | [`commit.js#L158`](../api/commit.js#L158) |

---

## ⚙️ Environment Variables

Configure these environment variables in your Vercel project dashboard:

| Variable Name | Description | Read at | Source |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | Google AI Studio API key | [`generate.js#L206`](../api/generate.js#L206) | [Google AI Studio](https://aistudio.google.com/) |
| `GITHUB_TOKEN` | GitHub Personal Access Token with repository write permissions | [`commit.js#L191`](../api/commit.js#L191) | [GitHub Token Settings](https://github.com/settings/tokens/new) |
| `GITHUB_REPO` | Target GitHub repository (defaults to `xwchow/my-playground`) | [`commit.js#L192`](../api/commit.js#L192) | GitHub |
| `STUDIO_SECRET` | Secret PIN or passcode to protect your builder from unauthorized access | [`generate.js#L193`](../api/generate.js#L193), [`commit.js#L176`](../api/commit.js#L176) | User-defined secret |

If `STUDIO_SECRET` is unset, both endpoints skip authorization entirely. When it is set, the client sends it as the `x-studio-secret` header from [`getAuthHeaders()`](./index.html#L382).

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
4. Select **Generate App** to build the application — [`handleGenerate()`](./index.html#L568).
5. Tap **Preview** to test the application interactively — [`setPreviewContent()`](./index.html#L435).
6. Select **Push to GitHub** to publish your application — [`handleCommit()`](./index.html#L653).

---

## 🧪 Verification

Run the test suite with Node.js:

```bash
node builder/test.js
```

[`test.js`](./test.js) imports the serverless helpers directly ([`test.js#L13`](./test.js#L13)) and asserts:

| # | Test | Location |
| ---: | :--- | :--- |
| 1 | Design system tokens & sandbox isolation in `builder/index.html` | [`test.js#L24`](./test.js#L24) |
| 2 | `parseModelOutput()` on raw unescaped script payloads | [`test.js#L36`](./test.js#L36) |
| 3 | `generateProjectCardHtml()` snippet output | [`test.js#L107`](./test.js#L107) |
| 4 | Card injection into the root `index.html` | [`test.js#L124`](./test.js#L124) |
| 5 | Project entry injection into the root `README.md` | [`test.js#L141`](./test.js#L141) |
| 6 | `validateAppDataSecurity()` path traversal prevention | [`test.js#L149`](./test.js#L149) |
| 7 | API route presence & passcode authorization | [`test.js#L178`](./test.js#L178) |
