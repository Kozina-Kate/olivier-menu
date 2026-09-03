import { HeroSection } from './components/HeroSection'
import { MenuPlanner } from './components/MenuPlanner'
import { RecipeCatalog } from './components/RecipeCatalog'
import { RecipeDetails } from './components/RecipeDetails'
import { SiteFooter } from './components/SiteFooter'
import { SiteHeader } from './components/SiteHeader'
import { useMenuPlanner } from './hooks/useMenuPlanner'
import { useRecipeFilters } from './hooks/useRecipeFilters'
import { useRecipes } from './hooks/useRecipes'
import { useShoppingListActions } from './hooks/useShoppingListActions'
import './App.css'

/**
 * Корневой компонент отвечает только за композицию приложения.
 *
 * Вся логика разбита на пользовательские хуки по предметным областям, а
 * разметка — на компоненты. Благодаря этому поток данных виден сверху вниз:
 * hooks создают данные и callbacks → App передаёт их компонентам через props.
 */
function App() {
  const { recipes } = useRecipes()
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
        <HeroSection />
        <RecipeCatalog
          categories={filters.categories}
          filter={filters.filter}
          onFilterChange={filters.setFilter}
          onOpenRecipe={menu.openRecipe}
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
        <RecipeDetails recipe={menu.activeRecipe} />
      </main>

      <SiteFooter />
      {shoppingActions.notice && (
        <div className="toast" role="status">{shoppingActions.notice}</div>
      )}
    </div>
  )
}

export default App
