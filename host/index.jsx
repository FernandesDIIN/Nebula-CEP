// Localização: host/index.jsx

function syncSelection() {
    try {
        var doc = app.activeDocument;
        var bounds = doc.selection.bounds; 
        
        var tempDoc = doc.duplicate("Temp_Nebula_Sync");
        tempDoc.flatten(); 
        
        // A LINHA MÁGICA QUE EU TINHA ESQUECIDO: Corta exatamente no letreiro!
        tempDoc.crop(bounds); 
        
        if (tempDoc.mode != DocumentMode.RGB) { tempDoc.changeMode(ChangeMode.RGB); }
        tempDoc.bitsPerChannel = BitsPerChannelType.EIGHT;
        
        var tempFolder = Folder.temp.fsName.replace(/\\/g, '/'); 
        var filePath = tempFolder + "/nebula_selection.jpg";
        var file = new File(filePath);
        
        var saveOptions = new JPEGSaveOptions();
        saveOptions.quality = 10;
        tempDoc.saveAs(file, saveOptions, true, Extension.LOWERCASE);
        tempDoc.close(SaveOptions.DONOTSAVECHANGES);
        
        return "SUCCESS|" + filePath + "|" + bounds[0].value + "|" + bounds[1].value + "|" + bounds[2].value + "|" + bounds[3].value;
    } catch(e) {
        return "ERRO|" + e.toString();
    }
}

function applyResult(imagePath, left, top, right, bottom) {
    try {
        var doc = app.activeDocument;
        var originalRuler = app.preferences.rulerUnits;
        app.preferences.rulerUnits = Units.PIXELS;

        var idPlc = charIDToTypeID( "Plc " );
        var desc = new ActionDescriptor();
        var idnull = charIDToTypeID( "null" );
        desc.putPath( idnull, new File( imagePath ) );
        var idFTcs = charIDToTypeID( "FTcs" );
        var idQCSt = charIDToTypeID( "QCSt" );
        var idQcsa = charIDToTypeID( "Qcsa" );
        desc.putEnumerated( idFTcs, idQCSt, idQcsa );
        executeAction( idPlc, desc, DialogModes.NO );

        var newLayer = doc.activeLayer;
        newLayer.name = "Nebula_Cleaned";

        var currentLeft = newLayer.bounds[0].value;
        var currentTop = newLayer.bounds[1].value;
        newLayer.translate(parseFloat(left) - currentLeft, parseFloat(top) - currentTop);

        var targetW = parseFloat(right) - parseFloat(left);
        var targetH = parseFloat(bottom) - parseFloat(top);
        var currentW = newLayer.bounds[2].value - newLayer.bounds[0].value;
        var currentH = newLayer.bounds[3].value - newLayer.bounds[1].value;

        newLayer.resize((targetW/currentW)*100, (targetH/currentH)*100, AnchorPosition.TOPLEFT);
        newLayer.rasterize(RasterizeType.ENTIRELAYER);

        app.preferences.rulerUnits = originalRuler;
        return "OK";
    } catch(e) {
        app.preferences.rulerUnits = Units.PIXELS;
        return "ERRO|" + e.toString();
    }
}