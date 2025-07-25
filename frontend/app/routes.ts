import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/history", "routes/history.tsx"),
  route("/digest/:publicId", "routes/digest.$publicId.tsx")
] satisfies RouteConfig;
