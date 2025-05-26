import { Routes, Route } from 'react-router-dom'
import { routeConfig, type RouteConfig } from './index'

// Helper function to render routes recursively
const renderRoutes = (routes: RouteConfig[]): React.ReactNode[] => {
  const routeElements: React.ReactNode[] = []
  
  routes.forEach((route, index) => {
    // For the root layout route, children are actual children.
    // For other routes, children are part of the path and should not be nested here
    // if we're aiming for a mostly flat structure from AppRoutes down.
    // However, for Outlet to work, the routes *must* be nested as react-router expects.
    routeElements.push(
      <Route
        key={`${route.path}-${index}`}
        path={route.path}
        element={route.element}
      >
        {route.children && renderRoutes(route.children)}
      </Route>
    )
  })
  
  return routeElements
}

// Main AppRoutes component
export const AppRoutes = () => {
  return (
    <Routes>
      {renderRoutes(routeConfig)}
    </Routes>
  )
} 