import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { ItemPageComponent } from "./item-page/item-page.component";
import { HomeComponent } from "./home/home.component";
import { SearchPageComponent } from "./search-page/search-page.component";

const routes: Routes = [
  { path: "search", component: SearchPageComponent },
  { path: "item/:id", component: ItemPageComponent },
  {
    path: "home",
    component: HomeComponent,
  },
  { path: "", redirectTo: "/home", pathMatch: "full" },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
