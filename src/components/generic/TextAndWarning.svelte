<!-- TextAndWarning.svelte
A component that shows a warning icon and some text next to it.
Can be used for warning headings, etc. -->
<script>
    import {passClassList} from "../../lib/utils.js";
    import Icon from "@iconify/svelte";
    // The warningType can be used to either display a "danger" warning
    // or a classic "warning" icon (see below).
    export let warningType = "warning"
    export let size = "small"
    const WARNING_TYPE_TO_ICON = {
        warning: "material-symbols:warning",
        danger: "mingcute:warning-fill"
    }
    const SIZE_TO_CLASSES = {
        small: "text-sm",
        medium: "text-base",
        big: "text-xl"
    }
</script>
<p class={passClassList(
    [
    SIZE_TO_CLASSES[size],
    "flex flex-row gap-x-2 font-bold py-3"
    ]
)}>
<Icon icon={WARNING_TYPE_TO_ICON[warningType]}/>
    <slot/>
</p>
