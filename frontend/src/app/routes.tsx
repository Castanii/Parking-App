import { createBrowserRouter } from "react-router";
import { Root } from "./pages/Root";
import { MapView } from "./pages/MapView";
import { Profile } from "./pages/Profile";
import { Tickets } from "./pages/Tickets";
import { Payment } from "./pages/Payment";
import { Messages } from "./pages/Messages";
import { NotFound } from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: MapView },
      { path: "profile", Component: Profile },
      { path: "tickets", Component: Tickets },
      { path: "payment/:lotId", Component: Payment },
      { path: "messages", Component: Messages },
      { path: "*", Component: NotFound },
    ],
  },
]);