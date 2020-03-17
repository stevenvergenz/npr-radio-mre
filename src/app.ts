/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { resolve } from 'path';

// https://17853.live.streamtheworld.com/KUOWFM_HIGH_MP3.mp3?dist=kuow

/**
 * A simple music player for Street Hoops World in Altspace.
 * Users can play/pause a looping track.
 * Author: Adrian Balanon Audio By: Megan Frazier
 */
export default class NprRadio {
	private assets: MRE.AssetContainer;
	private trackInstance: MRE.MediaInstance = null;
	private radioBody: MRE.Actor;
	private wooferAnim: MRE.Animation;
	private playObj: MRE.Actor;

	constructor(private context: MRE.Context, private baseUrl: string) {
		// create asset container for audio
		this.assets = new MRE.AssetContainer(this.context);
		this.context.onStarted(() => this.started());
	}

	// Once the context is "started", initialize the app.
	private async started() {
		const kuow = this.assets.createVideoStream("KUOW", {
			uri: 'https://17853.live.streamtheworld.com/KUOWFM_HIGH_MP3.mp3?dist=kuow'
		});

		this.radioBody = MRE.Actor.CreateFromGltf(this.assets, {
			uri: `${this.baseUrl}/boombox.glb`,
			colliderType: 'box',
			actor: {
				name: 'BoomboxBody'
			}
		});

		await this.radioBody.created();
		this.wooferAnim = this.radioBody.animationsByName.get("boombox_woofer_Action");
		this.wooferAnim.wrapMode = MRE.AnimationWrapMode.Loop;

		const vidSettings: MRE.SetVideoStateOptions = { visible: false, paused: false, volume: 1.0 };
		this.radioBody.setBehavior(MRE.ButtonBehavior)
			.onHover('enter', user => {
				if (!/moderator/u.test(user.properties['altspacevr-roles'])) return;
				this.radioBody.animateTo(
					{ transform: { local: { scale: { x: 1.1, y: 1.1, z: 1.1 } } } },
					0.3, MRE.AnimationEaseCurves.EaseOutCubic);
			})
			.onHover('exit', user => {
				if (!/moderator/u.test(user.properties['altspacevr-roles'])) return;
				this.radioBody.animateTo(
					{ transform: { local: { scale: { x: 1, y: 1, z: 1 } } } },
					0.3, MRE.AnimationEaseCurves.EaseOutCubic);
			})
			.onClick(user => {
				if (!/moderator/u.test(user.properties['altspacevr-roles'])) return;

				if (!this.playObj) {
					this.playObj = MRE.Actor.Create(this.context, { actor: { name: "PlayObject" }});
					this.playObj.startVideoStream(kuow.id, vidSettings);
					this.wooferAnim.play();
				} else {
					this.playObj.destroy();
					this.playObj = null;
					this.wooferAnim.stop();
				}
			});
	}
}

const server = new MRE.WebHost({
	baseDir: resolve(__dirname, '..', 'public')
});
server.adapter.onConnection(context => new NprRadio(context, server.baseUrl));
