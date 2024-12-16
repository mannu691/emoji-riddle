import { SettingScope, SettingsFormField } from "@devvit/public-api";

export const installSettings: SettingsFormField[] = [
    {
        type: "string",
        name: "riddleCategories",
        label: "Allowed Riddle Categories",
        placeholder: "Types seperated by (,)", defaultValue: "Riddle",
        scope: SettingScope.Installation,
        onValidate: ({ value }) => {
            if (!value || value.length == 0) return "Riddle Categories can't be empty";
        },
        helpText:
            "Affects post title like : 'What is This {Riddle Category}'",
    },

]