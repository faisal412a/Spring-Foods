const http = require("http");

const erpData = {
  company: "PolarPeak Frozen Foods",
  modules: [
    "Dashboard",
    "Inventory",
    "Products",
    "Sales Orders",
    "Purchasing",
    "Production",
    "Cold Chain",
    "Customers",
    "Suppliers",
    "HR & Payroll",
    "Accounting"
  ]
};

const server = http.createServer((request, response) => {
  response.setHeader("Content-Type", "application/json");

  if (request.url === "/health") {
    response.writeHead(200);
    response.end(JSON.stringify({ status: "ok", service: "frozen-food-erp-api" }));
    return;
  }

  if (request.url === "/erp") {
    response.writeHead(200);
    response.end(JSON.stringify(erpData));
    return;
  }

  response.writeHead(404);
  response.end(JSON.stringify({ error: "Not found" }));
});

const port = process.env.PORT || 3001;
server.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
