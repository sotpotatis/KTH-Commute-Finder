<!-- IconButton.svelte
What the name says. A clickable button. -->
<script>
    import Icon from "@iconify/svelte";
    import {passClassList} from "../../lib/utils.js";
    export let iconName;
    export let color = "white"
    export let backgroundColor = null; // Allow defining a background color
    export let noBorder = false; // Allow disabling border (only applicable if background color has been set)
    export let size = "medium"
    export let circular = true; // Allow making the button less rounded
    export let extraClasses = null
    // Set a custom button type, e.g. for forms
    export let buttonType = null
    // Define colors
    const COLORS_TO_CLASSES = {
        white: "text-white"
    }
    const BACKGROUND_COLORS_TO_CLASSES = {
        blue: "bg-blue-400 text-white",
        yellow: "bg-yellow-500 ring-yellow-700",
        gray: "bg-gray-400 ring-gray-500",
        indigo: "bg-indigo-500 ring-indigo-700",
        red: "bg-red-500 ring-red-700"
    }
    // Define font sizes
    const SIZES_TO_CLASSES = {
        base: "text-base",
        medium: "text-2xl",
        big: "text-4xl"
    }
    let classesToApply = [
        ...(extraClasses !== null ? extraClasses : []), // Extra classes have the highest priority
    COLORS_TO_CLASSES[color],
     SIZES_TO_CLASSES[size],
    "font-bold hover:cursor-pointer max-w-min"
]
    if (backgroundColor !== null){
         classesToApply.push(BACKGROUND_COLORS_TO_CLASSES[backgroundColor])
        classesToApply.push(...[`${circular ? "rounded-full" : "rounded-lg"}`,`${noBorder? "ring-2 ": ""}`, "p-1"]) // Add background specific classes
    }

</script>
<!-- Create button  and forward on:click event. -->
<button type={buttonType} class={passClassList(classesToApply)} on:click>
    <Icon icon={iconName}/>
</button>