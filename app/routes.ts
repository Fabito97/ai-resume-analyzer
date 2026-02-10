import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("/auth", "routes/auth.tsx"),
    route("/upload/:id?", "routes/upload.tsx"),
    route("/optimise-resume/:id", "routes/optimize.tsx"),
    route("/resume/:id", "routes/resume.tsx"),
    route("/wipe", 'routes/wipe.tsx'),
] satisfies RouteConfig;
