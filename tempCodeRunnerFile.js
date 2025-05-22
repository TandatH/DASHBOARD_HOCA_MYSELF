function toggleDevice(device, state) {
    const imgEl = document.getElementById(device + 'Img');

    if (device === 'light') {
        imgEl.src = state ? 'led-light_git.gif' : 'led-light_anh.png';
    } else if (device === 'filter') {
        imgEl.src = state ? 'water-filter_anh2,png' : 'water-filter_anh.png';
    }

    console.log(`${device} is now ${state ? 'ON' : 'OFF'}`);
}