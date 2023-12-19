<!-- Iconpopup.svelte
A clickable icon badge that triggers a popup.
-->
<script>
import Popup from "./Popup.svelte";
import Icon from "@iconify/svelte";
import {passClassList} from "../../lib/utils.js";
import IconButton from "./IconButton.svelte";
export let iconName;
export let showPopup
export let backgroundColor = "blue"
const classesToApply = [
    "rounded-full p-2 ring-2 text-white",
]
</script>
<IconButton rounded={true} backgroundColor={backgroundColor} iconName={iconName} size="base" class={passClassList(classesToApply)}/>
<Popup showPopup={showPopup} on:popupClosed>
    <!-- Provide ability for programmer (me!) to fill out content -->
    <svelte:fragment slot="popup-header">
        <slot name="popup-header"/>
    </svelte:fragment>
    <svelte:fragment slot="popup-body">
            <slot name="popup-body"/>
    </svelte:fragment>
</Popup>