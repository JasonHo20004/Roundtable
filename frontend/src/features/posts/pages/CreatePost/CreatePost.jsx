import React, {useEffect, useMemo, useRef, useState} from "react";
import TextEdit from "#shared/components/UIElement/TextEditor/TextEditor"; // Assuming correct path
import Button from "#shared/components/UIElement/Button/Button"; // Assuming correct path
import Icon from "#shared/components/UIElement/Icon/Icon"; // Assuming correct path
import Avatar from "#shared/components/UIElement/Avatar/Avatar"; // Assuming correct path
import LoadingSpinner from "#shared/components/UIElement/LoadingSpinner/LoadingSpinner"; // Assuming correct path
import Form from "#shared/components/UIElement/Form/Form"; // Assuming correct path
import Input from "#shared/components/UIElement/Input/Input"; // Assuming correct path
import {useActionData, useLoaderData, useNavigate, useNavigation, useParams} from 'react-router'; // Make sure it's 'react-router-dom'
import './CreatePost.css'; // Assuming CSS file exists
import subtableService from "#services/subtableService.jsx";
export default function CreatePost() {
    // --- Hooks ---
    const loaderData = useLoaderData();
    const actionData = useActionData(); // Data returned from your action function (e.g., validation errors)
    const navigation = useNavigation(); // Provides navigation state (idle, loading, submitting)
    const navigate = useNavigate();
    const editorRef = useRef(null);    // Ref to access TextEdit component methods
    const {subtableName} = useParams(); // Get subtable name from URL, e.g., /s/AskAnything/submit

    // --- State ---
    const [subtableDropdownVisible, setSubtableDropdownVisible] = useState(false);
    const [subtableSearchValue, setSubtableSearchValue] = useState("");
    const [selectedSubtable, setSelectedSubtable] = useState(null); // Holds the chosen community object
    const [subtablesWithMedia, setSubtablesWithMedia] = useState([]);

    // REMOVED: const [contentValue, setContentValue] = useState(''); // No longer needed for submission logic

    // --- Derived State ---
    // Memoize available subtables to prevent recalculation on every render
    const availableSubtables = useMemo(() => loaderData?.subtables || [], [loaderData]);
    // Check if the page loader is running
    const isLoading = navigation.state === "loading";
    // Check if the form is currently submitting to the action
    const isSubmitting = navigation.state === "submitting";
    // Get the form error message from the action data, if submission failed
    const formError = actionData?.success === false ? actionData.message : null;
    // Get any error from the loader data itself
    const loaderError = loaderData?.error;

    // --- Effects ---

    // Effect to set the selected subtable based on URL parameter (subtableName)
    // Runs when availableSubtables loads or subtableName changes.
    useEffect(() => {
        if (subtableName && availableSubtables.length > 0) {
            // Find the subtable matching the name from the URL (case-insensitive)
            const initialSub = availableSubtables.find(sub => sub.name.toLowerCase() === subtableName.toLowerCase());
            // Update state only if found and not already selected correctly
            if (initialSub && (!selectedSubtable || selectedSubtable.subtableId !== initialSub.subtableId)) {
                setSelectedSubtable(initialSub);
            }
        } else {
            // The user has subscribed any subtables
            setSelectedSubtable(null);
        }
    }, [availableSubtables, subtableName, selectedSubtable]);

    useEffect(() => {
        // Create async function inside useEffect
        const fetchSubtableMedia = async () => {
            if (selectedSubtable !== null) {
                try {
                    const mediaResponse = await subtableService.getSubtableMedia(
                        selectedSubtable.icon,
                        selectedSubtable.name
                    );
                    // Create a new object to trigger re-render
                    setSelectedSubtable(prev => ({
                        ...prev,
                        icon: mediaResponse.data.url
                    }));
                } catch (error) {
                    console.error('Error fetching subtable media:', error);
                }
            }
        };

        // Call the async function
        fetchSubtableMedia();
    }, [selectedSubtable]); // Dependency array

    // Effect to handle closing the subtable dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            const dropdownElement = document.getElementById("SubtableDropdown"); // Target the dropdown container
            // If the click is outside the dropdown element, hide it
            if (dropdownElement && !dropdownElement.contains(event.target)) {
                setSubtableDropdownVisible(false);
            }
        };
        // Add listener only when dropdown is visible
        if (subtableDropdownVisible) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }
        // Cleanup: remove listener when component unmounts or dropdown closes
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [subtableDropdownVisible]);

    // --- Handlers ---

    // Handles selecting a subtable from the dropdown
    const handleSubtableSelect = (sub) => {
        setSubtableDropdownVisible(false); // Close dropdown
        setSubtableSearchValue("");       // Clear search
        setSelectedSubtable(sub);          // Update state immediately for responsiveness
        // Navigate to the URL for the selected subtable, replacing the current history entry
        navigate(`/s/${sub.name}/submit`, {replace: true});
    };

    const handleBeforeSubmit = (event) => {
        const form = event.currentTarget;
        const hiddenContentInput = form.elements.namedItem('content');

        // Ensure the editor reference and the hidden input are available
        if (editorRef.current && hiddenContentInput) {
            const currentContent = editorRef.current.getContent(); // Assumes method returns HTML/text

            hiddenContentInput.value = currentContent;

            if (!currentContent || currentContent.trim() === '' || currentContent === '<p></p>') {
                console.warn("Client-side check: Content appears empty.");
                event.preventDefault();
                alert("Content cannot be empty."); // Example client-side feedback
            }
        } else {
            console.error("Error during submission prep: Editor ref or hidden content input ('content') not found.");
            event.preventDefault();
        }
    };

    // --- Filtering Logic ---
    // Filter available subtables based on the search input value (case-insensitive)
    const filteredSubtables = availableSubtables.filter(sub =>
        sub.name.toLowerCase().includes(subtableSearchValue.toLowerCase())
    );
    useEffect(() => {
        const loadSubtableMedia = async () => {
            const updatedSubtables = await Promise.all(
                filteredSubtables.map(async (sub) => {
                    try {
                        const mediaResponse = await subtableService.getSubtableMedia(
                            sub.icon,
                            sub.name
                        );
                        return {
                            ...sub,
                            icon: mediaResponse.data.url
                        };
                    } catch (error) {
                        console.error(`Error loading media for subtable ${sub.name}:`, error);
                        return sub;
                    }
                })
            );
            setSubtablesWithMedia(updatedSubtables);
        };

        if (filteredSubtables.length > 0) {
            loadSubtableMedia();
        }
    }, [filteredSubtables]);

    // --- Render ---

    // Display a loading spinner if the initial loader data is still loading
    if (isLoading && availableSubtables.length === 0) {
        return <LoadingSpinner message="Loading communities..."/>;
    }

    // Display an error message if the loader failed
    if (loaderError) {
        return <div className="alert alert-danger">Error loading data: {loaderError}</div>;
    }

    // Optional: Handle case where URL param subtable wasn't found after loading
    if (!isLoading && subtableName && availableSubtables.length > 0 && !selectedSubtable) {
        // This checks if loading is done, a name was in the URL, subtables are loaded, but we still couldn't select one
        const subExists = availableSubtables.some(sub => sub.name.toLowerCase() === subtableName.toLowerCase());
        if (!subExists) {
            return <div className="alert alert-warning">Community 's/{subtableName}' not found or access denied.</div>;
        }
        // If it exists but isn't selected yet, it might be due to timing, the main form will render.
    }


    return (
        // Use React Router's Form component for enhanced form handling (submission to actions)
        <Form
            method="post"                 // HTTP method for the action
            onSubmit={handleBeforeSubmit} // Hook before submission to inject editor content
            replace                       // Replace current history entry on submission/redirect
        >
            <div className="card">
                <h3 className="front-bold ms-3 fs-6 mt-4">Create Post</h3>

                {/* Subtable Selector Dropdown */}
                <div className="m-3 position-relative" id="SubtableDropdown">
                    <Button
                        addClass={`ConfigButton d-flex align-items-center justify-content-between ${subtableDropdownVisible ? 'custom' : ''}`}
                        onClick={() => setSubtableDropdownVisible(prev => !prev)} // Toggle dropdown visibility
                        type="button" // IMPORTANT: Prevent this button from submitting the form
                        aria-haspopup="true"
                        aria-expanded={subtableDropdownVisible}
                    >
                        {selectedSubtable ? (
                            <>
                                <Avatar
                                    src={selectedSubtable.icon}
                                    alt={`s/${selectedSubtable.name}`}
                                    width={20}
                                    height={20}
                                    addClass="me-2" // Margin for spacing
                                />
                                <span className="mx-2">{`s/${selectedSubtable.name}`}</span>
                            </>
                        ) : (
                            // Placeholder text if no subtable is selected yet
                            <span>{subtableName && availableSubtables.length > 0 ? `Loading s/${subtableName}...` : 'Choose a community'}</span>
                        )}
                        <Icon name="down" size="10px"/> {/* Dropdown arrow icon */}
                    </Button>

                    {/* Dropdown List (Conditionally Rendered) */}
                    {subtableDropdownVisible && (
                        <div className="dropdown-menu d-block mt-1 p-2 shadow"
                             style={{minWidth: '300px', maxHeight: '300px', overflowY: 'auto', zIndex: 1050}}>
                            <input
                                type="text"
                                placeholder="Search communities..."
                                className="form-control form-control-sm mb-2"
                                value={subtableSearchValue}
                                onChange={(e) => setSubtableSearchValue(e.target.value)} // Update search state
                            />
                            {/* Render filtered list or 'not found' message */}
                            {subtablesWithMedia.length > 0 ? (
                                subtablesWithMedia.map((sub) => (
                                    <Button
                                        key={sub.subtableId}
                                        justifyContent="start" // Align content to the start
                                        addClass="dropdown-item d-flex align-items-center p-2 w-100 text-start" // Ensure full width and alignment
                                        onClick={() => handleSubtableSelect(sub)} // Select this subtable
                                        type="button" // Also prevent form submission
                                    >
                                        <Avatar
                                            src={sub.icon}
                                            alt={`s/${sub.name}`}
                                            width={30}
                                            height={30}
                                            addClass="me-2 flex-shrink-0" // Margin and prevent shrinking
                                        />
                                        <div className="flex-grow-1"> {/* Allow text to take remaining space */}
                                            <div className="fs-7 fw-bold">{`s/${sub.name}`}</div>
                                            <span className="text-muted fs-8">{sub.memberCount ?? 0} members</span>
                                        </div>
                                    </Button>
                                ))
                            ) : (
                                <div className="p-2 text-muted fs-8">No matching communities found.</div>
                            )}
                        </div>
                    )}
                </div>

                {/* Hidden Input for Selected Subtable ID */}
                {/* Value comes directly from the selectedSubtable state */}
                <input type="hidden" name="subtableId" value={selectedSubtable?.subtableId || ""}/>

                {/* Title Input */}
                <div className="ms-3 me-3 mt-3">
                    <Input
                        id="title"
                        name="title"
                        placeholder="Title*"
                        label="Title"
                        required
                        addClass="rounded-input"
                    />
                </div>

                <input type="hidden" name="content"/>

                {/* Text Editor Component */}
                <div className="m-3">
                    {/* Pass the ref so we can access its methods (like getContent) */}
                    <TextEdit ref={editorRef} name="contentEditor"/> {/* Use a different name if 'content' conflicts */}
                </div>

                {/* Footer with Error Display and Submit Button */}
                <div className="card-footer d-flex justify-content-end align-items-center">
                    {/* Display error message from backend action, if any */}
                    {formError && <div className="text-danger me-auto align-self-center fs-8">{formError}</div>}

                    {/* Submit Button */}
                    <Button
                        addClass="custom" // Your custom styling class
                        type="submit"
                        disabled={isSubmitting || !selectedSubtable}
                    >
                        {isSubmitting ? (
                            <>
                                {/* Loading spinner during submission */}
                                <span
                                    className="spinner-border spinner-border-sm me-2"
                                    role="status"
                                    aria-hidden="true"></span>
                                Posting...
                            </>
                        ) : (
                            "Post" // Default button text
                        )}
                    </Button>
                </div>
            </div>
        </Form>
    );
}