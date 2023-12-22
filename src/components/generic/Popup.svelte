<!-- Popup.svelte
Defines a generic popup. The popup appears in the middle of the page.
-->
<script>
    import IconButton from "./IconButton.svelte";
    import {createEventDispatcher} from "svelte";
    export let showPopup;
    const dispatch = createEventDispatcher()
</script>
{#if showPopup}
    <div class="fixed top-0 left-0 min-w-screen w-full h-screen backdrop-blur-3xl opacity-80 z-20 bg-gray-700">
        <!-- Popup box wrapper -->
        <div class="flex items-center justify-center w-full h-full">
        <div class="bg-gray-900 text-white px-3 m-auto rounded-lg">
            <!-- Heading/header for popup -->
            <header class="font-bold px-3">
                <p>
                <span><slot name="popup-header"/></span>
                <!-- Close button -->
                <span>
                <IconButton color="white" iconName="material-symbols:close" on:click={()=>{
                    dispatch("popupClosed")}}/>
                </span></p>
            </header>
            <hr class="border-gray-300 px-8"/>
            <!-- Body for popup -->
            <section class="py-3 text-sm">
                <slot name="popup-body"/>
            </section>
        </div>
            </div>
    </div>
{/if}
