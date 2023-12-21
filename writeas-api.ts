import { MarkdownView, Setting } from "obsidian";

export async function authenticate(login: string, password: string): Promise<string> {

    return '';

}

export function getBlogs() {
    return ['Blog 1', 'Blog 2'];
}

// uploads the current page as an anonymous post, also handles errors
export async function uploadAsAnonymousPost(settings: any): Promise<any> {

    // get the file name, which is used as the title
    const postTitle = this.app.workspace.getActiveFile().basename;

    // get document text.  Using editor rather than view, since view doesn't render all the text?
    const currentDocument = this.app.workspace.getActiveViewOfType(MarkdownView).editor.getDoc();
    let currentText = currentDocument.getValue();
   
    const postData = {
        body: currentText,
        title: postTitle,
        font: settings.postType
    }

    const uploadResponse = await fetch('https://write.as/api/posts', {
        method: 'POST',
        mode: "no-cors",
        headers: {

            "Content-Type": "application/json",
        },
        body: JSON.stringify(postData)
        }
    );

    console.log(uploadResponse);

}