import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatInputModule } from "@angular/material/input";
import { MatIconModule } from "@angular/material/icon";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatSelectModule } from "@angular/material/select";

@NgModule({
  imports: [
    CommonModule,
    MatInputModule,
    MatIconModule,
    MatCardModule,
    MatButtonModule,
    MatAutocompleteModule,
    MatSelectModule
  ],
  exports: [
    MatInputModule,
    MatIconModule,
    MatCardModule,
    MatButtonModule,
    MatAutocompleteModule,
    MatSelectModule
  ]
})
export class MaterialModule {}
