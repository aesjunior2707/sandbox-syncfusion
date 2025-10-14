<template>
  <div class="p-4">
    <ejs-grid
      ref="grid"
      :dataSource="data"
      :editSettings="editSettings"
      :toolbar="toolbar"
      :allowPaging="true"
      :pageSettings="{ pageSize: 5 }"
      :allowSorting="true"
      :allowFiltering="true"
      :queryCellInfo="onQueryCellInfo"
      :actionBegin="onActionBegin"
    >
      <e-columns>
        <e-column field="id" headerText="ID" width="100" textAlign="Right" isPrimaryKey="true"/>
        <e-column field="name" headerText="Nome" width="200" :edit="nameEditParams" editType="dropdownedit"/>
        <e-column field="age" headerText="Idade" width="100" textAlign="Right" editType="numericedit"/>
        <e-column field="city" headerText="Cidade" width="150"/>
      </e-columns>
    </ejs-grid>
  </div>
</template>

<script>
/* eslint-disable no-unused-vars */

import { registerLicense } from '@syncfusion/ej2-base'

registerLicense(
  'ORg4AjUWIQA/Gnt2XFhhQlJHfV5AQmBIYVp/TGpJfl96cVxMZVVBJAtUQF1hTH5XdUViWnxdcXNTTmNZWkd1',
)


import { ref } from "vue";
import { GridComponent, ColumnsDirective, ColumnDirective, Page, Sort, Filter, Edit, Toolbar } from "@syncfusion/ej2-vue-grids";
import { DropDownList } from "@syncfusion/ej2-dropdowns";
import { Grid } from "@syncfusion/ej2-grids";

// Import CSS do Syncfusion
import '@syncfusion/ej2-base/styles/material.css';
import '@syncfusion/ej2-buttons/styles/material.css';
import '@syncfusion/ej2-grids/styles/material.css';
import '@syncfusion/ej2-dropdowns/styles/material.css';
import '@syncfusion/ej2-inputs/styles/material.css';

Grid.Inject(Page, Sort, Filter, Edit, Toolbar);

export default {
  data() {
    return {
      data: [
        { id: 1, name: "João", age: 28, city: "São Paulo" },
        { id: 2, name: "Maria", age: 34, city: "Rio de Janeiro" },
        { id: 3, name: "Pedro", age: 25, city: "Curitiba" },
        { id: 4, name: "Ana", age: 30, city: "Belo Horizonte" },
        { id: 5, name: "Lucas", age: 22, city: "Fortaleza" },
      ],
      nameLookup: [
        { name: "João", city: "São Paulo" },
        { name: "Maria", city: "Rio de Janeiro" },
        { name: "Pedro", city: "Curitiba" },
        { name: "Ana", city: "Belo Horizonte" },
        { name: "Lucas", city: "Fortaleza" },
        { name: "Carla", city: "Salvador" },
        { name: "Rafael", city: "Manaus" },
      ],
      editSettings: { allowEditing: true, allowAdding: true, allowDeleting: true, mode: "Batch" },
      toolbar: ["Add", "Edit", "Delete", "Update", "Cancel"],
      dropdownObj: null
    };
  },
  methods: {
    nameEditParams(args) {
      this.dropdownObj = new DropDownList({
        dataSource: this.nameLookup,
        fields: { text: "name", value: "name" },
        placeholder: "Selecione um nome...",
        value: args.rowData[args.column.field],
        change: (e) => {
          const selected = this.nameLookup.find(x => x.name === e.value);
          if (selected) {
            args.rowData.name = selected.name;
            args.rowData.city = selected.city;
            args.column.grid.refreshRow(args.rowIndex);
          }
        }
      });
      this.dropdownObj.appendTo(args.element);
    },
    onQueryCellInfo(args) {
      if (args.column.field === "name" && args.data?.city) {
        args.cell.innerText = `${args.data.name} - ${args.data.city}`;
      }
    },
    onActionBegin(args) {
      if (args.requestType === "save") {
        const updatedRows = Array.isArray(args.data) ? args.data : [args.data];
        updatedRows.forEach((row) => {
          const selected = this.nameLookup.find(x => x.name === row.name);
          if (selected) row.city = selected.city;
        });
      }
    }
  }
}
</script>

<style>

@import "~@syncfusion/ej2-base/styles/material.css";
@import "~@syncfusion/ej2-buttons/styles/material.css";
@import "~@syncfusion/ej2-inputs/styles/material.css";
@import "~@syncfusion/ej2-dropdowns/styles/material.css";
@import "~@syncfusion/ej2-grids/styles/material.css";
@import "~@syncfusion/ej2-calendars/styles/material.css";
@import "~@syncfusion/ej2-lists/styles/material.css";
@import "~@syncfusion/ej2-navigations/styles/material.css";
@import "~@syncfusion/ej2-popups/styles/material.css";
@import "~@syncfusion/ej2-splitbuttons/styles/material.css";

.e-grid {
  background: white;
}

</style>
