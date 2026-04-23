import { createBrowserRouter, Navigate, Outlet } from "react-router";
import { Root } from "./pages/Root";
import { MapView } from "./pages/MapView";
import { Profile } from "./pages/Profile";
import { Tickets } from "./pages/Tickets";
import { Payment } from "./pages/Payment";
import { Messages } from "./pages/Messages";
import { Reservations } from "./pages/Reservations";
import { NotFound } from "./pages/NotFound";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ProtectedRoute } from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/register",
    Component: Register,
  },
  {
    path: "/",
    Component: ProtectedRoute,
    children: [
      {
        Component: Root,
        children: [
          { index: true, Component: MapView },
          { path: "profile", Component: Profile },
          { path: "tickets", Component: Tickets },
          { path: "payment/:lotId", Component: Payment },
          { path: "messages", Component: Messages },
          { path: "reservations", Component: Reservations },
          { path: "*", Component: NotFound },
        ],
      },
    ],
  },
]);
