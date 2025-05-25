import { Routes, Route } from 'react-router-dom'
import { routeConfig, type RouteConfig } from './index'

// Helper function to render routes recursively
const renderRoutes = (routes: RouteConfig[]): React.ReactNode[] => {
  const routeElements: React.ReactNode[] = []
  
  routes.forEach((route, index) => {
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