# OpenReady Prototype

Static HTML/CSS/JS prototype for a café and milk-tea startup planning product.

## Roles

- **Public**: marketing / landing page (`index.html`)
- **User**: plan setup, dashboard, budget, forecast, scenarios, checklist (`user/`)
- **Admin**: templates and estimate library (`admin/`)

## Run locally

No build step is required.

```bash
python -m http.server 8080
```

Open: `http://localhost:8080`

## Prototype goals

The product is not a POS. It helps a founder plan before opening:

- startup cost
- monthly expenses
- staff cost
- menu and ingredient economics
- 3–12 month forecast
- capital requirement and funding gap
- break-even sales
- estimate/quote/confirmed cost confidence
- opening-readiness checklist
- what-if scenarios

## Structure

```text
openready-prototype/
├── index.html
├── assets/
│   ├── styles.css
│   └── app.js
├── user/
│   ├── dashboard.html
│   ├── onboarding.html
│   ├── budget.html
│   ├── forecast.html
│   ├── scenarios.html
│   └── checklist.html
└── admin/
    ├── dashboard.html
    ├── templates.html
    └── estimates.html
```

## Notes

All numbers are demo planning assumptions and must not be treated as guaranteed real-world costs.
