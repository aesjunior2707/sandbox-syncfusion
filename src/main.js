import { createApp } from 'vue'
import App from './App.vue'


// Syncfusion
import { GridPlugin } from '@syncfusion/ej2-vue-grids'
import { DropDownListPlugin } from '@syncfusion/ej2-vue-dropdowns'

const app = createApp(App)


app.use(GridPlugin)
app.use(DropDownListPlugin)

app.mount('#app')