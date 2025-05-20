// src/features/subtables/actions/createSubtableAction.jsx (new file)
import subtableService from "#services/subtableService.jsx";

export default async function createSubtableAction({request}) {
    console.log("createSubtableAction CALLED!");

    const formData = await request.formData();
    const name = formData.get('name');
    const description = formData.get('description');
    const iconFile = formData.get('iconFile');
    const bannerFile = formData.get('bannerFile');
    // const subtableType = formData.get('subtableType');
    // const isNSFW = formData.get('isNSFW') === 'on'; // Checkbox value is 'on' or null

    console.log("createSubtableAction: name", name);
    console.log("createSubtableAction: description", description);
    console.log("createSubtableAction: iconFile", iconFile);
    console.log("createSubtableAction: bannerFile", bannerFile);

    const data = new FormData();
    data.append('name', name);
    data.append('description', description);
    data.append('iconFile', iconFile);
    data.append('bannerFile', bannerFile);

    // Basic validation (can be more robust)
    if (!name || name.trim() === '') {
        return {success: false, message: 'Community name is required.'};
    }
    if (name.trim().length < 3) {
        return {success: false, message: 'Community name must be at least 3 characters.'};
    }

    if (!description || description.trim() === '') {
        return {success: false, message: 'Community description is required.'};
    }

    if (description.trim().length < 10) {
        return {success: false, message: 'Community description must be at least 10 characters.'};
    }

    // Make sure that iconFile is a valid image file only if a file was actually uploaded
    if (iconFile && iconFile.size > 0 && (!iconFile.type.startsWith('image/') && !iconFile.name.endsWith('.png') && !iconFile.name.endsWith('.jpg') && !iconFile.name.endsWith('.jpeg'))) {
        return {success: false, message: 'Icon file must be a JPEG or PNG image.'};
    }

    // Make sure that bannerFile is a valid image file only if a file was actually uploaded
    if (bannerFile && bannerFile.size > 0 && (!bannerFile.type.startsWith('image/') && !bannerFile.name.endsWith('.png') && !bannerFile.name.endsWith('.jpg') && !bannerFile.name.endsWith('.jpeg'))) {
        return {success: false, message: 'Banner file must be a JPEG or PNG image.'};
    }

    const response = await subtableService.createSubtable(data);
    if (response.success) {
        return {
            success: response.success,
            message: response.message,
            subtable: response.data.subtable
        };
    } else {
        return {
            success: response.success,
            message: response.message,
            error: response.error
        };
    }
}