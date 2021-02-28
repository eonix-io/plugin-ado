<template>
   <div class="container m-5 py-5 bg-beige">
      <div class="row">
         <div class="col">
            <config></config>
         </div>
      </div>
   </div>
</template>

<script lang="ts">
   import { defineComponent } from 'vue';
   import Config from './components/Config.vue';

   export default defineComponent({
      name: 'App',
      components: {
         Config
      },
      setup() {
         return {};
      }
   });
</script>


<style>
   :root {
      --light-blue: #41c3f2;
      --dark-blue: #0b2132;
      --beige: #ede8e1;
   }
</style>

<style lang="postcss">
   @import url("https://fonts.googleapis.com/css?family=Fira+Code|Montserrat&display=swap");

   @font-face {
      font-family: Pasajero;
      src: url("/Pasajero.otf") format("opentype");
   }
   * {
      font-family: "Montserrat", sans-serif;
      font-size: 14px;
   }

   html,
   body,
   #app {
      background-color: #343a40;
      height: 100%;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
   }

   input,
   select,
   textarea {
      background-color: rgba(255, 255, 255, 0.5) !important;

      &:focus,
      &:hover:not([disabled]) {
         background-color: #f8f9fa !important;
      }

      &:focus {
         border: 1px solid var(--light-blue) !important;
         box-shadow: none !important;
      }

      &[disabled] {
         cursor: not-allowed;
         background-color: #e9ecef !important;
      }
   }

   input[type="checkbox"] + label {
      margin-left: 0.5rem;
   }

   .border,
   .border-start {
      &:not(.border-danger) {
         border-color: #343a40 !important;
      }

      &.border-form {
         border-color: #ced4da !important;
      }

      &.border-width-2 {
         border-width: 2px !important;
      }
   }

   .bg-dark {
      background-color: var(--dark-blue) !important;
      color: #fff;
   }

   .dark {
      color: var(--dark-blue) !important;
   }

   .bg-light {
      background-color: var(--light-blue) !important;
   }

   .light {
      color: var(--light-blue);
   }

   .bg-beige {
      background-color: var(--beige) !important;
   }

   .text-danger {
      color: #990110 !important;
   }

   .nav.nav-pills {
      .nav-link {
         color: var(--dark-blue);

         &.active {
            color: var(--light-blue) !important;
            background-color: var(--dark-blue) !important;
         }
      }

      &.dark {
         .nav-link {
            color: var(--light-blue) !important;

            &.hover-invert:hover {
               color: var(--dark-blue) !important;
               background-color: var(--light-blue);
            }
         }
      }
   }

   .nav.nav-tabs {
      .nav-link {
         color: var(--light-blue) !important;

         border-color: #e9ecef #e9ecef #dee2e6;

         &.active {
            background-color: var(--beige) !important;
            color: var(--dark-blue) !important;
         }
      }
   }

   .btn-dark {
      background-color: var(--dark-blue) !important;

      &[disabled] {
         cursor: not-allowed;
      }

      &:not(.text-danger) {
         color: var(--light-blue) !important;
      }

      &:hover:not([disabled]) {
         color: #fff !important;
      }
   }

   .btn-link {
      padding: 0;
      text-decoration: underline;
      vertical-align: unset;

      &:hover {
         color: var(--light-blue) !important;
      }
   }

   small > p {
      margin-bottom: 0.5rem;
   }

   code {
      font-family: "Fira Code", monospace !important;
      font-weight: 100 !important;
   }

   .form-group {
      margin-bottom: 0.5rem;
   }

   [class^="col"],
   [class*=" col"] {
      margin-bottom: 1rem;
   }

   button,
   [role="button"],
   .clickable,
   [role="button"] * {
      cursor: pointer !important;

      &[disabled] {
         cursor: not-allowed;
      }
   }

   .form-disabled {
      input,
      select,
      textarea {
         pointer-events: none;
         background-color: transparent !important;
      }

      .form-disabled-hidden {
         visibility: hidden;
      }

      .form-disabled-d-none {
         display: none;
      }
   }
</style>

