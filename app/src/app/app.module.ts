import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { MaterialModule } from "./material/material.module";
import { ItemComponent } from "./item/item.component";
import { SearchComponent } from "./search/search.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { HttpClientModule } from "@angular/common/http";
import { ItemPageComponent } from "./item-page/item-page.component";
import { HomeComponent } from "./home/home.component";
import { SearchPageComponent } from "./search-page/search-page.component";
import { GridComponent } from "./grid/grid.component";

@NgModule({
  declarations: [
    AppComponent,
    ItemComponent,
    SearchComponent,
    ItemPageComponent,
    HomeComponent,
    SearchPageComponent,
    GridComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MaterialModule,
    HttpClientModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
