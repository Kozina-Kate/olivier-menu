import { Route, Routes } from 'react-router-dom'
import { MenuPlanner } from './components/MenuPlanner'
import { RecipeCatalog } from './components/RecipeCatalog'
import { SiteFooter } from './components/SiteFooter'
import { SiteHeader } from './components/SiteHeader'
import { HeroSection } from './components/HeroSection'
import { useMenuPlanner } from './hooks/useMenuPlanner'
import { useRecipeFilters } from './hooks/useRecipeFilters'
import { useRecipes } from './hooks/useRecipes'
import { useShoppingListActions } from './hooks/useShoppingListActions'
import { HomePage } from './pages/HomePage'
import { PantryPage } from './pages/PantryPage'
import { RecipePage } from './pages/RecipePage'
import { NotFoundPage } from './pages/NotFoundPage'
import './App.css'

/**
 * Корневой компонент отвечает только за композицию приложения.
 *
 * Вся логика разбита на пользовательские хуки по предметным областям, а
 * разметка — на компоненты. Благодаря этому поток данных виден сверху вниз:
 * hooks создают данные и callbacks → App передаёт их компонентам через props.
 */
function App() {
  const { isLoading, recipes } = useRecipes()
  const filters = useRecipeFilters(recipes)
  const menu = useMenuPlanner(recipes)
  const shoppingActions = useShoppingListActions({
    guests: menu.guests,
    hasMenu: menu.hasMenu,
    shoppingText: menu.shoppingText,
  })

  return (
    <div className="app-shell">
      <SiteHeader menuCount={menu.menuRecipes.length} />

      <main id="top">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/menu"
            element={(
              <>
                <HeroSection />
                <RecipeCatalog
                  categories={filters.categories}
                  filter={filters.filter}
                  onFilterChange={filters.setFilter}
                  onQueryChange={filters.setQuery}
                  onToggleMenu={menu.toggleMenu}
                  query={filters.query}
                  recipes={filters.visibleRecipes}
                  selectedSlugs={menu.selectedSlugs}
                />
                <MenuPlanner
                  checked={menu.checked}
                  guests={menu.guests}
                  hasMenu={menu.hasMenu}
                  ingredients={menu.shoppingIngredients}
                  menuRecipes={menu.menuRecipes}
                  onChangeGuests={menu.changeGuests}
                  onCopy={shoppingActions.copyList}
                  onDownload={shoppingActions.downloadList}
                  onShare={shoppingActions.shareList}
                  onToggleChecked={menu.toggleChecked}
                />
              </>
            )}
          />
          <Route path="/pantry" element={<PantryPage />} />
          <Route
            path="/recipes/:slug"
            element={<RecipePage isLoading={isLoading} recipes={recipes} />}
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <SiteFooter />
      {shoppingActions.notice && (
        <div className="toast" role="status">{shoppingActions.notice}</div>
      )}
    </div>
  )
}

export default App
